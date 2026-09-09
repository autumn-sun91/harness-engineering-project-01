import type { ApiErrorCode, Category, Plan, UploadStatus } from "./constants";

export interface Subscription {
  userId: string;
  plan: Plan;
  polarStatus: string | null;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  lastEventId: string | null;
  lastEventTs: string | null;
  updatedAt: string;
}

export interface CsvUpload {
  id: string;
  userId: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  skippedRowCount: number;
  status: UploadStatus;
  errorCode: ApiErrorCode | null;
  scopeStart: string | null;
  scopeEnd: string | null;
  currency: string | null;
  retryCount: number;
  uploadedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export type DecimalString = string;

export type TransactionKind = "debit" | "credit";

export interface Transaction {
  id: string;
  uploadId: string;
  userId: string;
  occurredOn: string;
  description: string;
  merchantNormalized: string;
  // Monetary values stay as decimal strings so currency arithmetic never uses JavaScript number.
  amount: DecimalString;
  kind: TransactionKind;
  currency: string;
  category: Category;
  createdAt: string;
}
