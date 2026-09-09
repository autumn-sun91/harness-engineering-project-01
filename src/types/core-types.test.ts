import { describe, expect, it } from "vitest";

import {
  API_ERROR_CODES,
  CATEGORIES,
  MAX_ANALYSIS_RETRIES,
  MAX_COLUMNS,
  MAX_FILE_SIZE_BYTES,
  MAX_ROWS,
  PLAN_LIMITS,
  REPORT_LOOKBACK_MONTHS,
  UPLOAD_STATUSES,
  type AnalysisResult,
} from "./index";

describe("core type contracts", () => {
  it("keeps the fixed category vocabulary", () => {
    expect(CATEGORIES).toEqual([
      "식비",
      "교통",
      "주거",
      "통신",
      "의료",
      "쇼핑",
      "구독",
      "기타",
    ]);
  });

  it("keeps the upload status contract", () => {
    expect(UPLOAD_STATUSES).toEqual([
      "uploading",
      "parsing",
      "analyzing",
      "completed",
      "failed",
    ]);
  });

  it("keeps the API error code contract", () => {
    expect(API_ERROR_CODES).toEqual([
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
    ]);
  });

  it("centralizes the plan and input limits", () => {
    expect(PLAN_LIMITS).toEqual({
      free: { monthlyUploads: 5 },
      pro: { monthlyUploads: 30 },
    });
    expect(REPORT_LOOKBACK_MONTHS).toBe(12);
    expect(MAX_ANALYSIS_RETRIES).toBe(3);
    expect(MAX_FILE_SIZE_BYTES).toBe(4_000_000);
    expect(MAX_ROWS).toBe(50_000);
    expect(MAX_COLUMNS).toBe(50);
  });

  it("allows analysis interpretation to be null", () => {
    const result: AnalysisResult = {
      uploadId: "upload-id",
      userId: "user-id",
      payload: {
        aggregates: {
          summary: {
            totalSpending: "0.00",
            transactionCount: 0,
            periodStart: null,
            periodEnd: null,
            averageDailySpending: "0.00",
            averageMonthlySpending: "0.00",
          },
          categorySpending: [],
          monthlyTrend: [],
          recurringPayments: [],
        },
        interpretation: null,
      },
      generatedAt: "2026-09-09T00:00:00.000Z",
    };

    expect(result.payload.interpretation).toBeNull();
  });
});
