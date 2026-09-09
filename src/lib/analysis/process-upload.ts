import {
  normalizeTransactions,
  profileCsv,
  type CsvColumnMapping,
  type CsvProfile,
  type ParsedTransaction,
} from "../csv";
import {
  aggregateTransactions,
} from "./index";
import {
  type AnalysisRepository,
  type AnalysisUploadStatus,
  type StoredAnalysisPayload,
} from "./analysis-repository";
import type {
  ClaudeResult,
  InterpretedScopes,
  MerchantCategories,
} from "../../services/claude";
import type {
  Aggregates,
  Category,
  Interpretation,
  Transaction,
} from "../../types";
import { CATEGORIES } from "../../types";

export interface ProcessUploadInput {
  uploadId: string;
  userId: string;
  accessToken: string;
  fileBytes: Uint8Array;
}

export interface ProcessUploadLlm {
  inferColumnMapping(profile: CsvProfile): Promise<ClaudeResult<CsvColumnMapping>>;
  classifyMerchants(merchants: string[]): Promise<ClaudeResult<MerchantCategories>>;
  interpretScopes(input: {
    recent12m: Aggregates;
    full: Aggregates;
  }): Promise<ClaudeResult<InterpretedScopes>>;
}

export interface ProcessUploadDeps {
  repository: AnalysisRepository;
  createRepository?: (accessToken: string) => AnalysisRepository;
  llm: ProcessUploadLlm;
  now?: () => number;
  createId?: () => string;
  model?: string;
}

const DEADLINE_MS = 240_000;
const DEFAULT_MODEL = "claude-sonnet-5";

type FailureCode =
  | "empty_file"
  | "encoding_error"
  | "parse_failed"
  | "column_mapping_failed"
  | "mixed_currency"
  | "unsupported_transaction_semantics"
  | "analysis_timeout"
  | "analysis_failed";

class ProcessUploadFailure extends Error {
  constructor(readonly errorCode: FailureCode) {
    super("Analysis processing failed");
    this.name = "ProcessUploadFailure";
  }
}

interface Usage {
  inputTokens: number;
  outputTokens: number;
}

function addUsage(left: Usage, right: Usage): Usage {
  return {
    inputTokens: left.inputTokens + right.inputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
  };
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `transaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function failureFromResult<T>(result: Extract<ClaudeResult<T>, { ok: false }>): ProcessUploadFailure {
  return new ProcessUploadFailure(
    result.errorCode === "column_mapping_failed"
      ? "column_mapping_failed"
      : "analysis_failed",
  );
}

function checkDeadline(now: () => number, startedAt: number): void {
  if (now() - startedAt >= DEADLINE_MS) {
    throw new ProcessUploadFailure("analysis_timeout");
  }
}

function transactionFromParsed(
  parsed: ParsedTransaction,
  input: ProcessUploadInput,
  createdAt: string,
  createId: () => string,
): Transaction {
  return {
    id: createId(),
    uploadId: input.uploadId,
    userId: input.userId,
    occurredOn: parsed.occurredOn,
    description: parsed.description,
    merchantNormalized: parsed.merchantNormalized,
    amount: parsed.amount,
    kind: parsed.kind,
    currency: parsed.currency,
    category: "기타",
    createdAt,
  };
}

function monthOrdinal(value: string): number {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  return year * 12 + month - 1;
}

function recentTransactions(transactions: readonly Transaction[]): Transaction[] {
  const latestDate = transactions.reduce<string | null>(
    (latest, transaction) => latest === null || transaction.occurredOn > latest
      ? transaction.occurredOn
      : latest,
    null,
  );
  if (latestDate === null) {
    return [];
  }

  const lastMonth = monthOrdinal(latestDate);
  const firstMonth = lastMonth - 11;
  return transactions.filter((transaction) => {
    const month = monthOrdinal(transaction.occurredOn);
    return month >= firstMonth && month <= lastMonth;
  });
}

function validateParsedTransactions(
  profile: CsvProfile,
  parsed: ReturnType<typeof normalizeTransactions>,
): void {
  if (parsed.errorCode !== null) {
    throw new ProcessUploadFailure(parsed.errorCode);
  }

  if (profile.rowCount === 0) {
    throw new ProcessUploadFailure("empty_file");
  }

  const validRowCount = profile.rowCount - parsed.skippedRows;
  if (validRowCount * 100 < profile.rowCount * 95) {
    throw new ProcessUploadFailure("parse_failed");
  }
  if (parsed.transactions.length === 0) {
    throw new ProcessUploadFailure("unsupported_transaction_semantics");
  }
  if (!parsed.transactions.some((transaction) => transaction.kind === "debit")) {
    throw new ProcessUploadFailure("unsupported_transaction_semantics");
  }

  const currencies = new Set(parsed.transactions.map((transaction) => transaction.currency));
  if (currencies.size > 1) {
    throw new ProcessUploadFailure("mixed_currency");
  }
}

function classifyTransactions(
  transactions: readonly Transaction[],
  result: ClaudeResult<MerchantCategories> | null,
): { transactions: Transaction[]; categories: Map<string, Category> } {
  const merchants = [...new Set(transactions.map((transaction) => transaction.merchantNormalized))];
  const categories = new Map<string, Category>(merchants.map((merchant) => [merchant, "기타"]));

  if (result?.data) {
    for (const merchant of merchants) {
      const category = result.data.get(merchant);
      if (category && isCategory(category)) {
        categories.set(merchant, category);
      }
    }
  }

  return {
    categories,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      category: categories.get(transaction.merchantNormalized) ?? "기타",
    })),
  };
}

function storedPayload(
  recent12m: Aggregates,
  full: Aggregates,
  interpretations: { recent12m: Interpretation | null; full: Interpretation | null },
  usage: Usage,
  model: string,
): StoredAnalysisPayload {
  return {
    schemaVersion: 1,
    scopes: {
      recent12m: { aggregates: recent12m, interpretation: interpretations.recent12m },
      full: { aggregates: full, interpretation: interpretations.full },
    },
    usage: { ...usage, model },
  };
}

export async function processUpload(
  input: ProcessUploadInput,
  deps: ProcessUploadDeps,
): Promise<void> {
  const now = deps.now ?? Date.now;
  const createId = deps.createId ?? defaultCreateId;
  const repository = deps.createRepository?.(input.accessToken) ?? deps.repository;
  const startedAt = now();
  const createdAt = new Date(startedAt).toISOString();
  let currentStatus: AnalysisUploadStatus = "queued";
  let fileBytes: Uint8Array | null = input.fileBytes;

  const transition = async (
    nextStatus: AnalysisUploadStatus,
    metadata?: Parameters<AnalysisRepository["transitionUpload"]>[0]["metadata"],
  ): Promise<void> => {
    await repository.transitionUpload({
      uploadId: input.uploadId,
      userId: input.userId,
      expectedStatus: currentStatus,
      nextStatus,
      metadata,
    });
    currentStatus = nextStatus;
  };

  const markFailed = async (errorCode: FailureCode): Promise<void> => {
    if (currentStatus === "failed" || currentStatus === "completed" || currentStatus === "partial") {
      return;
    }

    try {
      await transition("failed", { errorCode });
    } catch {
      // The original persistence error is intentionally not exposed. The
      // caller can observe the failed transition when the RPC is available.
    }
  };

  try {
    await transition("parsing");
    checkDeadline(now, startedAt);

    const profile = profileCsv(fileBytes as Uint8Array);
    if (profile.errorCode !== null) {
      throw new ProcessUploadFailure(profile.errorCode);
    }

    const mappingResult = await deps.llm.inferColumnMapping(profile);
    if (!mappingResult.ok) {
      throw failureFromResult(mappingResult);
    }
    let usage = mappingResult.usage;
    checkDeadline(now, startedAt);

    const parsed = normalizeTransactions(profile, mappingResult.data);
    validateParsedTransactions(profile, parsed);
    const transactions = parsed.transactions.map((transaction) => transactionFromParsed(
      transaction,
      input,
      createdAt,
      createId,
    ));

    await repository.insertTransactions(transactions);
    await transition("analyzing", {
      rowCount: parsed.totalRows,
      skippedRowCount: parsed.skippedRows,
      scopeStart: parsed.dateRange.start,
      scopeEnd: parsed.dateRange.end,
      currency: transactions[0]?.currency ?? null,
    });
    checkDeadline(now, startedAt);

    const merchants = [...new Set(transactions.map((transaction) => transaction.merchantNormalized))];
    let classificationResult: ClaudeResult<MerchantCategories> | null = null;
    try {
      classificationResult = await deps.llm.classifyMerchants(merchants);
      usage = addUsage(usage, classificationResult.usage);
    } catch {
      // A failed batch is represented by the default 기타 map and does not
      // prevent deterministic aggregates from being produced.
    }
    const classified = classifyTransactions(transactions, classificationResult);
    await repository.updateTransactionCategories({
      uploadId: input.uploadId,
      userId: input.userId,
      categories: classified.categories,
    });
    checkDeadline(now, startedAt);

    const fullAggregates = aggregateTransactions(classified.transactions);
    const recentAggregates = aggregateTransactions(recentTransactions(classified.transactions));

    let interpretations: { recent12m: Interpretation | null; full: Interpretation | null } = {
      recent12m: null,
      full: null,
    };
    let interpretationSucceeded = false;
    try {
      const interpretationResult = await deps.llm.interpretScopes({
        recent12m: recentAggregates,
        full: fullAggregates,
      });
      usage = addUsage(usage, interpretationResult.usage);
      if (interpretationResult.ok) {
        interpretations = interpretationResult.data;
        interpretationSucceeded = true;
      }
    } catch {
      // Aggregates are still persisted as a partial result.
    }
    checkDeadline(now, startedAt);

    await repository.saveAnalysisResult({
      uploadId: input.uploadId,
      userId: input.userId,
      payload: storedPayload(
        recentAggregates,
        fullAggregates,
        interpretations,
        usage,
        deps.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      ),
    });
    await transition(interpretationSucceeded ? "completed" : "partial");
  } catch (error) {
    const errorCode = error instanceof ProcessUploadFailure
      ? error.errorCode
      : "analysis_failed";
    await markFailed(errorCode);
  } finally {
    // Do not retain the source bytes beyond this invocation. The input object
    // is never passed to a repository or serialized.
    fileBytes = null;
  }
}
