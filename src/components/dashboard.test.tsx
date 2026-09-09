import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DashboardClient from "./dashboard/dashboard-client";
import { getUploadErrorMessage } from "./upload/upload-errors";
import { ReportView } from "./report/report-view";
import type { UploadReport } from "../types";

const aggregates = {
  summary: {
    totalSpending: "125000.00",
    transactionCount: 3,
    periodStart: "2025-10-01",
    periodEnd: "2026-09-01",
    averageDailySpending: "4166.67",
    averageMonthlySpending: "125000.00",
  },
  categorySpending: [
    { category: "식비" as const, totalAmount: "125000.00", transactionCount: 3, percentage: "100.00" },
  ],
  monthlyTrend: [
    { month: "2026-09", totalAmount: "125000.00", transactionCount: 3 },
  ],
  recurringPayments: [],
};

function report(overrides: Partial<UploadReport> = {}): UploadReport {
  return {
    scope: "recent12m",
    aggregates,
    interpretation: {
      summary: "요약입니다.",
      savings: {
        items: [{ title: "절약 항목", description: "절약 설명" }],
        totalCount: 1,
        locked: false,
      },
      anomalies: {
        items: [{ title: "확인 항목", description: "확인 설명" }],
        totalCount: 1,
        locked: false,
      },
    },
    ...overrides,
  };
}

describe("dashboard UI", () => {
  it("renders an upload CTA as a calm empty state", () => {
    const markup = renderToStaticMarkup(
      <DashboardClient initialUploads={[]} initialReport={null} />,
    );

    expect(markup).toContain("CSV 파일을 업로드해 분석을 시작하세요");
    expect(markup).toContain("업로드");
    expect(markup).not.toContain("오류");
  });

  it("renders billing notices and the customer portal entry point", () => {
    const markup = renderToStaticMarkup(
      <DashboardClient
        initialUploads={[]}
        initialReport={null}
        checkoutNotice="업그레이드가 취소되었어요"
        subscriptionNotice="현재 결제 주기(2026. 10. 9.)까지 Pro를 이용할 수 있어요"
        isPro
      />,
    );

    expect(markup).toContain("업그레이드가 취소되었어요");
    expect(markup).toContain("현재 결제 주기(2026. 10. 9.)까지 Pro를 이용할 수 있어요");
    expect(markup).toContain('href="/api/polar/portal"');
  });

  it.each([
    ["file_too_large", "파일이 4MB를 넘습니다."],
    ["empty_file", "파일에 거래 내역이 없습니다."],
    ["encoding_error", "파일 인코딩을 읽지 못했습니다."],
    ["parse_failed", "파일을 읽지 못했습니다."],
    ["upload_limit_reached", "이번 달 업로드 횟수를 모두 썼습니다."],
    ["retry_limit_exceeded", "재시도 횟수를 모두 썼습니다."],
  ] as const)("maps %s by code without parsing a provider message", (code, message) => {
    expect(getUploadErrorMessage(code)).toContain(message);
  });

  it("keeps aggregate cards visible when interpretation is unavailable", () => {
    const markup = renderToStaticMarkup(
      <ReportView report={report({ interpretation: null })} />,
    );

    expect(markup).toContain("카테고리별 지출");
    expect(markup).toContain("월별 추이");
    expect(markup).toContain("AI 해석을 불러오지 못했습니다.");
    expect(markup).toContain("다시 시도");
  });

  it("renders the server-trimmed Free response as locked teaser sections", () => {
    const markup = renderToStaticMarkup(
      <ReportView
        report={report({
          interpretation: {
            summary: "요약입니다.",
            savings: {
              items: [{ title: "첫 절약 항목", description: "첫 설명" }],
              totalCount: 3,
              locked: true,
            },
            anomalies: {
              items: [{ title: "첫 확인 항목", description: "첫 설명" }],
              totalCount: 5,
              locked: true,
            },
          },
        })}
      />,
    );

    expect(markup).toContain("5건 발견");
    expect(markup).toContain("3개 중 1개 표시");
    expect(markup).toContain("업그레이드");
  });

  it("escapes LLM text as plain text", () => {
    const markup = renderToStaticMarkup(
      <ReportView
        report={report({
          interpretation: {
            summary: "**강조** <a href=\"https://example.com\">링크</a>",
            savings: { items: [], totalCount: 0, locked: false },
            anomalies: { items: [], totalCount: 0, locked: false },
          },
        })}
      />,
    );

    expect(markup).toContain("**강조** &lt;a href=&quot;https://example.com&quot;&gt;링크&lt;/a&gt;");
    expect(markup).not.toContain('<a href="https://example.com">');
  });
});
