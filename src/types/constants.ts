export const CATEGORIES = [
  "식비",
  "교통",
  "주거",
  "통신",
  "의료",
  "쇼핑",
  "구독",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UPLOAD_STATUSES = [
  "uploading",
  "parsing",
  "analyzing",
  "completed",
  "failed",
] as const;

export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export const API_ERROR_CODES = [
  "unauthorized",
  "file_too_large",
  "invalid_file_type",
  "empty_file",
  "encoding_error",
  "parse_failed",
  "upload_limit_reached",
  "retry_limit_exceeded",
  "analysis_failed",
  "not_found",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export type ErrorCode = ApiErrorCode;

export const PLAN_LIMITS = {
  free: { monthlyUploads: 5 },
  pro: { monthlyUploads: 30 },
} as const;

export const REPORT_LOOKBACK_MONTHS = 12;
export const MAX_ANALYSIS_RETRIES = 3;
export const MAX_FILE_SIZE_BYTES = 4_000_000;
export const MAX_ROWS = 50_000;
export const MAX_COLUMNS = 50;

export type Plan = keyof typeof PLAN_LIMITS;
