import { describe, expect, it } from "vitest";

import type { Transaction } from "../../types";
import {
  aggregateCategorySpending,
  aggregateMonthlyTrend,
  aggregateTransactions,
  calculateSummaryStatistics,
  detectRecurringPayments,
} from "./index";

function transaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "transaction-id",
    uploadId: "upload-id",
    userId: "user-id",
    occurredOn: "2026-01-01",
    description: "Store",
    merchantNormalized: "store",
    amount: "100.00",
    kind: "debit",
    currency: "KRW",
    category: "식비",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("analysis aggregates", () => {
  it("aggregates spending categories and keeps category totals equal to total spending", () => {
    const transactions = [
      transaction({ id: "food-1", amount: "100.10", category: "식비" }),
      transaction({ id: "other-1", amount: "50.20", category: undefined as never }),
      transaction({ id: "refund", amount: "999.99", kind: "credit", category: "쇼핑" }),
    ];

    expect(aggregateCategorySpending(transactions)).toEqual([
      {
        category: "식비",
        totalAmount: "100.10",
        transactionCount: 1,
        percentage: "66.60",
      },
      {
        category: "기타",
        totalAmount: "50.20",
        transactionCount: 1,
        percentage: "33.40",
      },
    ]);

    expect(aggregateTransactions(transactions).summary.totalSpending).toBe("150.30");
  });

  it("fills months without spending transactions with zeroes", () => {
    expect(
      aggregateMonthlyTrend([
        transaction({ id: "jan", occurredOn: "2026-01-15", amount: "100.00" }),
        transaction({ id: "mar", occurredOn: "2026-03-02", amount: "25.50" }),
      ]),
    ).toEqual([
      { month: "2026-01", totalAmount: "100.00", transactionCount: 1 },
      { month: "2026-02", totalAmount: "0.00", transactionCount: 0 },
      { month: "2026-03", totalAmount: "25.50", transactionCount: 1 },
    ]);
  });

  it("detects a monthly recurring payment with a similar amount", () => {
    expect(
      detectRecurringPayments([
        transaction({ id: "one", occurredOn: "2026-01-15", merchantNormalized: "streaming", amount: "10.00", category: "구독" }),
        transaction({ id: "two", occurredOn: "2026-02-15", merchantNormalized: "streaming", amount: "10.10", category: "구독" }),
        transaction({ id: "three", occurredOn: "2026-03-15", merchantNormalized: "streaming", amount: "9.90", category: "구독" }),
      ]),
    ).toEqual([
      {
        merchantNormalized: "streaming",
        frequency: "monthly",
        averageAmount: "10.00",
        occurrenceCount: 3,
        lastOccurredOn: "2026-03-15",
      },
    ]);
  });

  it("excludes a merchant whose payment intervals are not weekly or monthly", () => {
    expect(
      detectRecurringPayments([
        transaction({ id: "one", occurredOn: "2026-01-01", merchantNormalized: "irregular", amount: "20.00" }),
        transaction({ id: "two", occurredOn: "2026-01-03", merchantNormalized: "irregular", amount: "20.00" }),
        transaction({ id: "three", occurredOn: "2026-04-01", merchantNormalized: "irregular", amount: "20.00" }),
      ]),
    ).toEqual([]);
  });

  it("sums decimal amounts without floating-point drift and calculates summary averages", () => {
    const result = calculateSummaryStatistics([
      transaction({ id: "one", occurredOn: "2026-01-01", amount: "0.10" }),
      transaction({ id: "two", occurredOn: "2026-01-31", amount: "0.20" }),
      transaction({ id: "three", occurredOn: "2026-03-01", amount: "0.30" }),
    ]);

    expect(result).toEqual({
      totalSpending: "0.60",
      transactionCount: 3,
      periodStart: "2026-01-01",
      periodEnd: "2026-03-01",
      averageDailySpending: "0.01",
      averageMonthlySpending: "0.20",
    });
  });

  it("returns empty aggregates for zero transactions", () => {
    expect(aggregateTransactions([])).toEqual({
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
    });
  });
});
