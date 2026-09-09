import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReportView } from "./report-view";

describe("ReportView", () => {
  it("renders aggregate sections", () => {
    const markup = renderToStaticMarkup(
      <ReportView
        report={{
          scope: "recent12m",
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
        }}
      />,
    );

    expect(markup).toContain("카테고리별 지출");
    expect(markup).toContain("월별 추이");
  });
});
