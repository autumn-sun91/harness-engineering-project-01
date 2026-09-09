import type { UploadReport } from "./api";

export const DASHBOARD_UPLOAD_STATUSES = [
  "queued",
  "uploading",
  "parsing",
  "analyzing",
  "partial",
  "completed",
  "failed",
] as const;

export type DashboardUploadStatus = (typeof DASHBOARD_UPLOAD_STATUSES)[number];

export interface DashboardUpload {
  id: string;
  userId: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  skippedRowCount: number;
  status: DashboardUploadStatus;
  errorCode: string | null;
  scopeStart: string | null;
  scopeEnd: string | null;
  currency: string | null;
  retryCount: number;
  uploadedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DashboardUploadDetail {
  uploadId: string;
  status: DashboardUploadStatus;
  errorCode: string | null;
  report: UploadReport | null;
}
