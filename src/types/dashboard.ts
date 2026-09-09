import type { UploadReport } from "./api";
import type { UploadStatus } from "./constants";

export interface DashboardUpload {
  id: string;
  userId: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  skippedRowCount: number;
  status: UploadStatus;
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
  status: UploadStatus;
  errorCode: string | null;
  report: UploadReport | null;
}
