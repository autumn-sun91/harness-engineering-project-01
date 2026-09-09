import type {
  AnomalyExplanation,
  Aggregates,
  Interpretation,
  SavingsInsight,
} from "./analysis";
import type { ApiErrorCode, UploadStatus } from "./constants";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface TrimmedReportSection<T> {
  items: T[];
  totalCount: number;
  locked: boolean;
}

export interface ReportInterpretation {
  summary: Interpretation["summary"];
  savings: TrimmedReportSection<SavingsInsight>;
  anomalies: TrimmedReportSection<AnomalyExplanation>;
}

export interface UploadReport {
  scope: "recent12m" | "full";
  aggregates: Aggregates;
  interpretation: ReportInterpretation | null;
}

export interface UploadDetailResponse {
  uploadId: string;
  status: UploadStatus;
  errorCode: ApiErrorCode | null;
  report: UploadReport | null;
}
