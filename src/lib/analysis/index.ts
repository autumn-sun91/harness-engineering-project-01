import {
  CATEGORIES,
  type Category,
  type CategorySpending,
  type DecimalString,
  type MonthlyTrend,
  type RecurringPaymentCandidate,
  type SummaryStatistics,
  type Transaction,
  type Aggregates,
} from "../../types";

const ZERO_CENTS = BigInt(0);
const CENTS_PER_UNIT = BigInt(100);
const RECURRING_MIN_OCCURRENCES = 3;
const WEEKLY_MIN_DAYS = 6;
const WEEKLY_MAX_DAYS = 8;
const MONTHLY_MIN_DAYS = 25;
const MONTHLY_MAX_DAYS = 35;
const SIMILAR_AMOUNT_VARIANCE_PERCENT = BigInt(10);
const CATEGORY_SET: ReadonlySet<string> = new Set(CATEGORIES);

type DateParts = { year: number; month: number; day: number };

interface SpendingTransaction {
  transaction: Transaction;
  amountCents: bigint;
}

interface DatedSpendingTransaction extends SpendingTransaction {
  date: DateParts;
  dayOrdinal: number;
}

type RecurringFrequency = "weekly" | "monthly";

function parseDecimalCents(value: DecimalString): bigint | null {
  const match = /^([+-]?)(\d+)(?:\.(\d{1,2}))?$/u.exec(value.trim());
  if (!match) {
    return null;
  }

  try {
    const unsigned = BigInt(match[2]) * CENTS_PER_UNIT + BigInt((match[3] ?? "").padEnd(2, "0"));
    return match[1] === "-" ? -unsigned : unsigned;
  } catch {
    return null;
  }
}

function absolute(value: bigint): bigint {
  return value < ZERO_CENTS ? -value : value;
}

function formatCents(value: bigint): DecimalString {
  const negative = value < ZERO_CENTS;
  const unsigned = absolute(value);
  const integer = unsigned / CENTS_PER_UNIT;
  const fraction = (unsigned % CENTS_PER_UNIT).toString().padStart(2, "0");
  return `${negative && unsigned !== ZERO_CENTS ? "-" : ""}${integer.toString()}.${fraction}`;
}

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= ZERO_CENTS) {
    return ZERO_CENTS;
  }

  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * BigInt(2) >= denominator ? quotient + BigInt(1) : quotient;
}

function formatRatioAsCents(numerator: bigint, denominator: bigint): DecimalString {
  return formatCents(roundDivide(numerator, denominator));
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

// A civil-date ordinal avoids timezone and daylight-saving effects when finding
// the exact number of days in an analysis period.
function dayOrdinal({ year, month, day }: DateParts): number {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const monthOfYear = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * monthOfYear + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra;
}

function monthOrdinal(date: DateParts): number {
  return date.year * 12 + date.month - 1;
}

function formatMonth(ordinal: number): string {
  const year = Math.floor(ordinal / 12);
  const month = ordinal % 12 + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function spendingTransactions(transactions: readonly Transaction[]): SpendingTransaction[] {
  const spending: SpendingTransaction[] = [];

  for (const transaction of transactions) {
    if (transaction.kind !== "debit") {
      continue;
    }

    const amount = parseDecimalCents(transaction.amount);
    if (amount !== null) {
      spending.push({ transaction, amountCents: absolute(amount) });
    }
  }

  return spending;
}

function datedTransactions(transactions: readonly Transaction[]): DatedSpendingTransaction[] {
  return spendingTransactions(transactions).flatMap((spending) => {
    const date = parseDate(spending.transaction.occurredOn);
    return date ? [{ ...spending, date, dayOrdinal: dayOrdinal(date) }] : [];
  });
}

function dateBounds(transactions: readonly Transaction[]): {
  start: { value: string; ordinal: number };
  end: { value: string; ordinal: number };
} | null {
  let start: { value: string; ordinal: number } | null = null;
  let end: { value: string; ordinal: number } | null = null;

  for (const transaction of transactions) {
    const date = parseDate(transaction.occurredOn);
    if (!date) {
      continue;
    }

    const value = transaction.occurredOn;
    const ordinal = dayOrdinal(date);
    if (start === null || ordinal < start.ordinal) {
      start = { value, ordinal };
    }
    if (end === null || ordinal > end.ordinal) {
      end = { value, ordinal };
    }
  }

  return start !== null && end !== null ? { start, end } : null;
}

function categoryFor(transaction: Transaction): Category {
  return CATEGORY_SET.has(transaction.category) ? transaction.category : "기타";
}

/** Aggregate debit transactions by their already-assigned category. */
export function aggregateCategorySpending(
  transactions: readonly Transaction[],
): CategorySpending[] {
  const totals = new Map<Category, { amountCents: bigint; transactionCount: number }>();
  let totalCents = ZERO_CENTS;

  for (const spending of spendingTransactions(transactions)) {
    const category = categoryFor(spending.transaction);
    const current = totals.get(category) ?? { amountCents: ZERO_CENTS, transactionCount: 0 };
    current.amountCents += spending.amountCents;
    current.transactionCount += 1;
    totals.set(category, current);
    totalCents += spending.amountCents;
  }

  return CATEGORIES.filter((category) => totals.has(category)).map((category) => {
    const aggregate = totals.get(category);
    if (!aggregate) {
      throw new Error("Category aggregate disappeared");
    }

    return {
      category,
      totalAmount: formatCents(aggregate.amountCents),
      transactionCount: aggregate.transactionCount,
      percentage: totalCents === ZERO_CENTS
        ? "0.00"
        : formatRatioAsCents(aggregate.amountCents * BigInt(10_000), totalCents),
    };
  });
}

/** Build a chronologically continuous monthly debit-spending time series. */
export function aggregateMonthlyTrend(
  transactions: readonly Transaction[],
): MonthlyTrend[] {
  const dated = datedTransactions(transactions);
  const bounds = dateBounds(transactions);
  if (dated.length === 0 || bounds === null) {
    return [];
  }

  const totals = new Map<number, { amountCents: bigint; transactionCount: number }>();
  for (const spending of dated) {
    const month = monthOrdinal(spending.date);
    const current = totals.get(month) ?? { amountCents: ZERO_CENTS, transactionCount: 0 };
    current.amountCents += spending.amountCents;
    current.transactionCount += 1;
    totals.set(month, current);
  }

  const firstMonth = monthOrdinal(parseDate(bounds.start.value) as DateParts);
  const lastMonth = monthOrdinal(parseDate(bounds.end.value) as DateParts);
  const trend: MonthlyTrend[] = [];
  for (let month = firstMonth; month <= lastMonth; month += 1) {
    const aggregate = totals.get(month) ?? { amountCents: ZERO_CENTS, transactionCount: 0 };
    trend.push({
      month: formatMonth(month),
      totalAmount: formatCents(aggregate.amountCents),
      transactionCount: aggregate.transactionCount,
    });
  }

  return trend;
}

function amountsAreSimilar(amounts: readonly bigint[]): boolean {
  if (amounts.length === 0) {
    return false;
  }

  const minimum = amounts.reduce((current, amount) => amount < current ? amount : current, amounts[0]);
  const maximum = amounts.reduce((current, amount) => amount > current ? amount : current, amounts[0]);
  return maximum === ZERO_CENTS
    ? false
    : (maximum - minimum) * BigInt(100) <= maximum * SIMILAR_AMOUNT_VARIANCE_PERCENT;
}

function matchesFrequency(intervalDays: number, frequency: RecurringFrequency): boolean {
  return frequency === "weekly"
    ? intervalDays >= WEEKLY_MIN_DAYS && intervalDays <= WEEKLY_MAX_DAYS
    : intervalDays >= MONTHLY_MIN_DAYS && intervalDays <= MONTHLY_MAX_DAYS;
}

function candidateFromRun(
  merchantNormalized: string,
  frequency: RecurringFrequency,
  run: readonly DatedSpendingTransaction[],
): RecurringPaymentCandidate | null {
  if (run.length < RECURRING_MIN_OCCURRENCES) {
    return null;
  }

  let totalCents = ZERO_CENTS;
  for (const spending of run) {
    totalCents += spending.amountCents;
  }

  return {
    merchantNormalized,
    frequency,
    averageAmount: formatCents(roundDivide(totalCents, BigInt(run.length))),
    occurrenceCount: run.length,
    lastOccurredOn: run[run.length - 1].transaction.occurredOn,
  };
}

function betterCandidate(
  current: RecurringPaymentCandidate | null,
  candidate: RecurringPaymentCandidate | null,
): RecurringPaymentCandidate | null {
  if (candidate === null) {
    return current;
  }
  if (current === null || candidate.occurrenceCount > current.occurrenceCount) {
    return candidate;
  }
  if (candidate.occurrenceCount === current.occurrenceCount && candidate.lastOccurredOn > current.lastOccurredOn) {
    return candidate;
  }
  return current;
}

function findCandidate(
  merchantNormalized: string,
  transactions: readonly DatedSpendingTransaction[],
  frequency: RecurringFrequency,
): RecurringPaymentCandidate | null {
  let best: RecurringPaymentCandidate | null = null;
  let run: DatedSpendingTransaction[] = [];

  const considerRun = () => {
    best = betterCandidate(
      best,
      candidateFromRun(merchantNormalized, frequency, run),
    );
  };

  for (const transaction of transactions) {
    if (transaction.amountCents === ZERO_CENTS) {
      considerRun();
      run = [];
      continue;
    }

    const previous = run[run.length - 1];
    const intervalDays = previous ? transaction.dayOrdinal - previous.dayOrdinal : 0;
    const nextRun = [...run, transaction];
    if (
      previous &&
      matchesFrequency(intervalDays, frequency) &&
      amountsAreSimilar(nextRun.map(({ amountCents }) => amountCents))
    ) {
      run = nextRun;
    } else {
      considerRun();
      run = [transaction];
    }
  }
  considerRun();
  return best;
}

/** Find debit transactions that repeat with weekly or monthly cadence. */
export function detectRecurringPayments(
  transactions: readonly Transaction[],
): RecurringPaymentCandidate[] {
  const groups = new Map<string, DatedSpendingTransaction[]>();
  for (const spending of datedTransactions(transactions)) {
    const merchant = spending.transaction.merchantNormalized.trim();
    if (merchant.length === 0) {
      continue;
    }

    const group = groups.get(merchant) ?? [];
    group.push(spending);
    groups.set(merchant, group);
  }

  const candidates: RecurringPaymentCandidate[] = [];
  for (const [merchant, group] of groups) {
    group.sort((left, right) => left.dayOrdinal - right.dayOrdinal || left.transaction.id.localeCompare(right.transaction.id));
    const weekly = findCandidate(merchant, group, "weekly");
    const monthly = findCandidate(merchant, group, "monthly");
    const candidate = betterCandidate(weekly, monthly);
    if (candidate !== null) {
      candidates.push(candidate);
    }
  }

  return candidates.sort((left, right) => left.merchantNormalized.localeCompare(right.merchantNormalized));
}

/** Calculate exact spending totals and period-normalized averages. */
export function calculateSummaryStatistics(
  transactions: readonly Transaction[],
): SummaryStatistics {
  const spending = spendingTransactions(transactions);
  let totalCents = ZERO_CENTS;
  for (const transaction of spending) {
    totalCents += transaction.amountCents;
  }

  const bounds = dateBounds(transactions);
  if (bounds === null) {
    return {
      totalSpending: formatCents(totalCents),
      transactionCount: spending.length,
      periodStart: null,
      periodEnd: null,
      averageDailySpending: "0.00",
      averageMonthlySpending: "0.00",
    };
  }

  const dayCount = bounds.end.ordinal - bounds.start.ordinal + 1;
  const startDate = parseDate(bounds.start.value);
  const endDate = parseDate(bounds.end.value);
  const monthCount = startDate && endDate
    ? monthOrdinal(endDate) - monthOrdinal(startDate) + 1
    : 0;

  return {
    totalSpending: formatCents(totalCents),
    transactionCount: spending.length,
    periodStart: bounds.start.value,
    periodEnd: bounds.end.value,
    averageDailySpending: formatRatioAsCents(totalCents, BigInt(dayCount)),
    averageMonthlySpending: formatRatioAsCents(totalCents, BigInt(monthCount)),
  };
}

/** Build the complete code-generated aggregate portion of an analysis payload. */
export function aggregateTransactions(
  transactions: readonly Transaction[],
): Aggregates {
  return {
    summary: calculateSummaryStatistics(transactions),
    categorySpending: aggregateCategorySpending(transactions),
    monthlyTrend: aggregateMonthlyTrend(transactions),
    recurringPayments: detectRecurringPayments(transactions),
  };
}
