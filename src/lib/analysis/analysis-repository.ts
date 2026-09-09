import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Aggregates, Interpretation } from "../../types";
import type { Category, Transaction, UploadStatus } from "../../types";

export interface TransitionUploadMetadata {
  rowCount?: number;
  skippedRowCount?: number;
  scopeStart?: string | null;
  scopeEnd?: string | null;
  currency?: string | null;
  errorCode?: string | null;
}

export interface TransitionUploadArgs {
  uploadId: string;
  userId: string;
  expectedStatus: UploadStatus;
  nextStatus: UploadStatus;
  metadata?: TransitionUploadMetadata;
}

export interface StoredScopeAnalysis {
  aggregates: Aggregates;
  interpretation: Interpretation | null;
}

export interface StoredAnalysisPayload {
  schemaVersion: 1;
  scopes: {
    recent12m: StoredScopeAnalysis;
    full: StoredScopeAnalysis;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
  };
}

export interface SaveAnalysisResultArgs {
  uploadId: string;
  userId: string;
  payload: StoredAnalysisPayload;
}

export interface UpdateTransactionCategoriesArgs {
  uploadId: string;
  userId: string;
  categories: ReadonlyMap<string, Category>;
}

export interface AnalysisRepository {
  transitionUpload(args: TransitionUploadArgs): Promise<void>;
  insertTransactions(transactions: readonly Transaction[]): Promise<void>;
  updateTransactionCategories(args: UpdateTransactionCategoriesArgs): Promise<void>;
  saveAnalysisResult(args: SaveAnalysisResultArgs): Promise<void>;
}

interface AnalysisSupabaseClient {
  rpc(
    functionName: string,
    params?: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message?: string } | null }>;
  from(table: string): {
    insert(values: unknown): Promise<{ error: { message?: string } | null }>;
    upsert(
      values: unknown,
      options?: { onConflict?: string },
    ): Promise<{ error: { message?: string } | null }>;
    update(values: unknown): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          eq(column: string, value: unknown): Promise<{ error: { message?: string } | null }>;
        };
      };
    };
  };
}

function repositoryError(): Error {
  // Deliberately do not include provider error text: it can contain user data
  // or SQL details that do not belong in application errors.
  return new Error("Analysis persistence failed");
}

function throwIfError(error: { message?: string } | null): void {
  if (error !== null) {
    throw repositoryError();
  }
}

function toDatabaseTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    upload_id: transaction.uploadId,
    user_id: transaction.userId,
    occurred_on: transaction.occurredOn,
    description: transaction.description,
    merchant_normalized: transaction.merchantNormalized,
    amount: transaction.amount,
    kind: transaction.kind,
    currency: transaction.currency,
    category: transaction.category,
    created_at: transaction.createdAt,
  };
}

/**
 * Build a repository around a Supabase client configured with the captured
 * user's access token. This function intentionally never creates or imports a
 * service-role client.
 */
export function createAnalysisRepository(input: {
  supabase: AnalysisSupabaseClient | SupabaseClient;
}): AnalysisRepository {
  const supabase = input.supabase as AnalysisSupabaseClient;

  return {
    async transitionUpload(args) {
      const { error } = await supabase.rpc("transition_upload", {
        upload_id: args.uploadId,
        expected_status: args.expectedStatus,
        next_status: args.nextStatus,
        metadata: args.metadata ?? {},
      });
      throwIfError(error);
    },

    async insertTransactions(transactions) {
      if (transactions.length === 0) {
        return;
      }

      const { error } = await supabase
        .from("transactions")
        .insert(transactions.map(toDatabaseTransaction));
      throwIfError(error);
    },

    async updateTransactionCategories({ uploadId, userId, categories }) {
      for (const [merchantNormalized, category] of categories) {
        const { error } = await supabase
          .from("transactions")
          .update({ category })
          .eq("upload_id", uploadId)
          .eq("user_id", userId)
          .eq("merchant_normalized", merchantNormalized);
        throwIfError(error);
      }
    },

    async saveAnalysisResult({ uploadId, userId, payload }) {
      const { error } = await supabase
        .from("analysis_results")
        .upsert(
          {
            upload_id: uploadId,
            user_id: userId,
            payload,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "upload_id" },
        );
      throwIfError(error);
    },
  };
}

function requiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

/** Create a user-token repository for an after() analysis invocation. */
export function createAnalysisRepositoryForAccessToken(accessToken: string): AnalysisRepository {
  if (accessToken.length === 0) {
    throw new Error("Access token is required");
  }

  const supabase = createClient(
    requiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  return createAnalysisRepository({ supabase });
}
