import { describe, expect, it, vi } from "vitest";

import type { CsvColumnMapping } from "../csv";
import type {
  AnalysisRepository,
  StoredAnalysisPayload,
  TransitionUploadArgs,
} from "./analysis-repository";
import { processUpload, type ProcessUploadDeps, type ProcessUploadInput } from "./process-upload";
import type { Transaction } from "../../types";

const mapping: CsvColumnMapping = {
  date: "Date",
  description: "Description",
  amount: {
    mode: "signed_single",
    amountColumn: "Amount",
    debitSign: "positive",
  },
};

const csv = [
  "Date,Description,Amount",
  "2025-02-01,Old merchant,10.00",
  "2026-08-01,Coffee shop,20.00",
  "2026-09-01,Coffee shop,20.00",
].join("\n");

function success<T>(data: T) {
  return { ok: true as const, data, usage: { inputTokens: 1, outputTokens: 2 } };
}

function interpretation(summary: string) {
  return {
    summary,
    savings: [],
    anomalies: [],
  };
}

function makeRepository() {
  const transitions: TransitionUploadArgs[] = [];
  const insertedTransactions: Transaction[] = [];
  const categoryUpdates: Array<ReadonlyMap<string, Transaction["category"]>> = [];
  const savedPayloads: StoredAnalysisPayload[] = [];

  const repository: AnalysisRepository = {
    transitionUpload: async (args) => {
      transitions.push(args);
    },
    insertTransactions: async (transactions) => {
      insertedTransactions.push(...transactions);
    },
    updateTransactionCategories: async ({ categories }) => {
      categoryUpdates.push(categories);
    },
    saveAnalysisResult: async ({ payload }) => {
      savedPayloads.push(payload);
    },
  };

  return { repository, transitions, insertedTransactions, categoryUpdates, savedPayloads };
}

function makeDeps(
  repository: AnalysisRepository,
  overrides: Partial<ProcessUploadDeps> = {},
): ProcessUploadDeps {
  let nextId = 0;
  return {
    repository,
    llm: {
      inferColumnMapping: async () => success(mapping),
      classifyMerchants: async (merchants) => success(new Map(merchants.map((merchant) => [merchant, "식비" as const]))),
      interpretScopes: async () => success({
        recent12m: interpretation("recent"),
        full: interpretation("full"),
      }),
    },
    now: () => 0,
    createId: vi.fn(() => `transaction-${nextId++}`),
    ...overrides,
  };
}

function input(fileBytes: Uint8Array = new TextEncoder().encode(csv)): ProcessUploadInput {
  return {
    uploadId: "upload-id",
    userId: "user-id",
    accessToken: "access-token-that-must-not-be-persisted",
    fileBytes,
  };
}

describe("processUpload", () => {
  it("runs queued to parsing to analyzing to completed through the transition RPC boundary", async () => {
    const state = makeRepository();
    const createRepository = vi.fn(() => state.repository);

    await processUpload(input(), makeDeps(state.repository, { createRepository }));

    expect(createRepository).toHaveBeenCalledWith("access-token-that-must-not-be-persisted");
    expect(state.transitions.map(({ expectedStatus, nextStatus }) => [expectedStatus, nextStatus])).toEqual([
      ["queued", "parsing"],
      ["parsing", "analyzing"],
      ["analyzing", "completed"],
    ]);
    expect(state.insertedTransactions).toHaveLength(3);
    expect(state.savedPayloads[0]?.scopes.recent12m.interpretation?.summary).toBe("recent");
  });

  it("saves both aggregate scopes and marks partial when interpretation fails", async () => {
    const state = makeRepository();
    const interpretationFailure = {
      ok: false as const,
      errorCode: "analysis_failed" as const,
      message: "provider failure",
      usage: { inputTokens: 3, outputTokens: 4 },
    };

    await processUpload(input(), makeDeps(state.repository, {
      llm: {
        inferColumnMapping: async () => success(mapping),
        classifyMerchants: async (merchants) => success(new Map(merchants.map((merchant) => [merchant, "식비" as const]))),
        interpretScopes: async () => interpretationFailure,
      },
    }));

    expect(state.savedPayloads).toHaveLength(1);
    expect(state.savedPayloads[0]?.scopes.recent12m.interpretation).toBeNull();
    expect(state.savedPayloads[0]?.scopes.full.aggregates.summary.totalSpending).toBe("50.00");
    expect(state.transitions.at(-1)).toMatchObject({
      expectedStatus: "analyzing",
      nextStatus: "partial",
    });
  });

  it("marks a profile or parsing failure with its error code without persisting raw bytes", async () => {
    const state = makeRepository();
    const rawBytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    const deps = makeDeps(state.repository, {
      llm: {
        inferColumnMapping: vi.fn(async () => success(mapping)),
        classifyMerchants: async () => success(new Map()),
        interpretScopes: async () => success({
          recent12m: interpretation("recent"),
          full: interpretation("full"),
        }),
      },
    });

    await processUpload(input(rawBytes), deps);

    expect(state.transitions.at(-1)).toMatchObject({
      expectedStatus: "parsing",
      nextStatus: "failed",
      metadata: { errorCode: "encoding_error" },
    });
    expect(deps.llm.inferColumnMapping).not.toHaveBeenCalled();
    expect(state.insertedTransactions).not.toContain(rawBytes);
  });

  it("uses 기타 for failed merchant batches and continues the analysis", async () => {
    const state = makeRepository();
    const classificationFailure = {
      ok: false as const,
      errorCode: "analysis_failed" as const,
      message: "one batch failed",
      usage: { inputTokens: 1, outputTokens: 1 },
      data: new Map([["coffee shop", "식비" as const]]),
    };

    await processUpload(input(), makeDeps(state.repository, {
      llm: {
        inferColumnMapping: async () => success(mapping),
        classifyMerchants: async () => classificationFailure,
        interpretScopes: async () => success({
          recent12m: interpretation("recent"),
          full: interpretation("full"),
        }),
      },
    }));

    expect([...state.categoryUpdates[0] ?? []]).toEqual([
      ["old merchant", "기타"],
      ["coffee shop", "식비"],
    ]);
    expect(state.transitions.at(-1)?.nextStatus).toBe("completed");
  });

  it("fails with analysis_timeout when the injected clock reaches the 240 second deadline", async () => {
    const state = makeRepository();
    const clockValues = [0, 240_000];
    const now = vi.fn(() => clockValues.shift() ?? 240_000);

    await processUpload(input(), makeDeps(state.repository, { now }));

    expect(state.transitions.at(-1)).toMatchObject({
      expectedStatus: "parsing",
      nextStatus: "failed",
      metadata: { errorCode: "analysis_timeout" },
    });
    expect(state.insertedTransactions).toHaveLength(0);
  });

  it("passes only the matching transactions to recent12m and full aggregation", async () => {
    const state = makeRepository();
    let interpretationInput: Parameters<NonNullable<ProcessUploadDeps["llm"]>["interpretScopes"]>[0] | undefined;

    await processUpload(input(), makeDeps(state.repository, {
      llm: {
        inferColumnMapping: async () => success(mapping),
        classifyMerchants: async (merchants) => success(new Map(merchants.map((merchant) => [merchant, "식비" as const]))),
        interpretScopes: async (inputValue) => {
          interpretationInput = inputValue;
          return success({
            recent12m: interpretation("recent"),
            full: interpretation("full"),
          });
        },
      },
    }));

    expect(interpretationInput?.recent12m.summary.totalSpending).toBe("40.00");
    expect(interpretationInput?.full.summary.totalSpending).toBe("50.00");
  });
});
