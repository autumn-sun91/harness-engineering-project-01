import type { DecimalString } from "./domain";
import type { Category } from "./constants";

export interface SummaryStatistics {
  totalSpending: DecimalString;
  transactionCount: number;
  periodStart: string | null;
  periodEnd: string | null;
  averageDailySpending: DecimalString;
  averageMonthlySpending: DecimalString;
}

export interface CategorySpending {
  category: Category;
  totalAmount: DecimalString;
  transactionCount: number;
  percentage: DecimalString;
}

export interface MonthlyTrend {
  month: string;
  totalAmount: DecimalString;
  transactionCount: number;
}

export type RecurringPaymentFrequency = "weekly" | "monthly";

export interface RecurringPaymentCandidate {
  merchantNormalized: string;
  frequency: RecurringPaymentFrequency;
  averageAmount: DecimalString;
  occurrenceCount: number;
  lastOccurredOn: string;
}

export interface Aggregates {
  summary: SummaryStatistics;
  categorySpending: CategorySpending[];
  monthlyTrend: MonthlyTrend[];
  recurringPayments: RecurringPaymentCandidate[];
}

export interface SavingsInsight {
  title: string;
  description: string;
}

export interface AnomalyExplanation {
  title: string;
  description: string;
}

export interface Interpretation {
  summary: string;
  savings: SavingsInsight[];
  anomalies: AnomalyExplanation[];
}

export interface AnalysisPayload {
  aggregates: Aggregates;
  interpretation: Interpretation | null;
}

export interface AnalysisResult {
  uploadId: string;
  userId: string;
  payload: AnalysisPayload;
  generatedAt: string;
}
