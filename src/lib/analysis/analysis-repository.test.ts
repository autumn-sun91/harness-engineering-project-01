import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ rpc: vi.fn(), from: vi.fn() })),
}));

import type { Transaction } from "../../types";
import {
  createAnalysisRepository,
  createAnalysisRepositoryForAccessToken,
  type StoredAnalysisPayload,
} from "./analysis-repository";
import { createClient } from "@supabase/supabase-js";

function transaction(): Transaction {
  return {
    id: "transaction-id",
    uploadId: "upload-id",
    userId: "user-id",
    occurredOn: "2026-09-01",
    description: "Coffee shop",
    merchantNormalized: "coffee shop",
    amount: "10.00",
    kind: "debit",
    currency: "KRW",
    category: "기타",
    createdAt: "2026-09-09T00:00:00.000Z",
  };
}

function payload(): StoredAnalysisPayload {
  return {
    schemaVersion: 1,
    scopes: {
      recent12m: {
        aggregates: {
          summary: {
            totalSpending: "10.00",
            transactionCount: 1,
            periodStart: "2026-09-01",
            periodEnd: "2026-09-01",
            averageDailySpending: "10.00",
            averageMonthlySpending: "10.00",
          },
          categorySpending: [],
          monthlyTrend: [],
          recurringPayments: [],
        },
        interpretation: null,
      },
      full: {
        aggregates: {
          summary: {
            totalSpending: "10.00",
            transactionCount: 1,
            periodStart: "2026-09-01",
            periodEnd: "2026-09-01",
            averageDailySpending: "10.00",
            averageMonthlySpending: "10.00",
          },
          categorySpending: [],
          monthlyTrend: [],
          recurringPayments: [],
        },
        interpretation: null,
      },
    },
    usage: { inputTokens: 1, outputTokens: 2, model: "claude-sonnet-5" },
  };
}

describe("analysis repository", () => {
  it("uses the user-token Supabase client for RPC transitions and derived-data writes", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const insert = vi.fn(async () => ({ error: null }));
    const upsert = vi.fn(async () => ({ error: null }));
    const updateEq = vi.fn((column: string, value: unknown) => {
      void value;
      if (column === "merchant_normalized") {
        return Promise.resolve({ error: null });
      }
      return { eq: updateEq };
    });
    const update = vi.fn(() => ({ eq: updateEq }));
    const from = vi.fn((table: string) => ({ table, insert, upsert, update }));
    const repository = createAnalysisRepository({ supabase: { rpc, from } as never });

    await repository.transitionUpload({
      uploadId: "upload-id",
      userId: "user-id",
      expectedStatus: "queued",
      nextStatus: "parsing",
    });
    await repository.insertTransactions([transaction()]);
    await repository.updateTransactionCategories({
      uploadId: "upload-id",
      userId: "user-id",
      categories: new Map([["coffee shop", "식비"]]),
    });
    await repository.saveAnalysisResult({
      uploadId: "upload-id",
      userId: "user-id",
      payload: payload(),
    });

    expect(rpc).toHaveBeenCalledWith("transition_upload", expect.objectContaining({
      upload_id: "upload-id",
      expected_status: "queued",
      next_status: "parsing",
    }));
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty("user_id");
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "transaction-id",
        upload_id: "upload-id",
        user_id: "user-id",
        amount: "10.00",
        category: "기타",
      }),
    ]);
    expect(update).toHaveBeenCalledWith({ category: "식비" });
    expect(updateEq).toHaveBeenCalledWith("upload_id", "upload-id");
    expect(updateEq).toHaveBeenCalledWith("user_id", "user-id");
  });

  it("does not expose a service-role client factory", async () => {
    const repositoryModule = await import("./analysis-repository");

    expect("createServiceRoleSupabaseClient" in repositoryModule).toBe(false);
  });

  it("configures the repository client with the captured access token", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    createAnalysisRepositoryForAccessToken("captured-access-token");

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer captured-access-token" } },
      }),
    );
  });
});
