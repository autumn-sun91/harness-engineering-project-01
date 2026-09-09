import {
  CATEGORIES,
  MAX_COLUMNS,
  MAX_ROWS,
  type ApiErrorCode,
  type Category,
  type TransactionKind,
} from "../../types";

export type CsvEncoding = "utf-8" | "euc-kr";

export type CsvErrorCode = Extract<
  ApiErrorCode,
  "empty_file" | "encoding_error" | "parse_failed"
>;

export interface CsvSignedAmountMapping {
  mode: "signed_single";
  amountColumn: string;
  debitSign: "positive" | "negative";
}

export interface CsvDebitCreditMapping {
  mode: "debit_credit_split";
  debitColumn: string;
  creditColumn: string;
}

/**
 * Column names are always supplied by the caller. This module never guesses
 * which header represents a date, amount, or description.
 */
export interface CsvColumnMapping {
  date?: string;
  description?: string;
  amount: string | CsvSignedAmountMapping | CsvDebitCreditMapping;
  currency?: string;
  kind?: string;
  kindMap?: Record<string, TransactionKind>;

  // Names used by the cross-step mapping contract are accepted as aliases.
  dateColumn?: string;
  descriptionColumn?: string;
  currencyColumn?: string | null;
  typeColumn?: string | null;
  defaultCurrency?: string;
  kindValueMap?: Record<string, TransactionKind>;
}

export interface CsvProfile {
  encoding: CsvEncoding | null;
  headers: string[];
  rows: Array<Record<string, string>>;
  rowCount: number;
  errorCode: CsvErrorCode | null;
}

export interface ParsedTransaction {
  occurredOn: string;
  description: string;
  merchantNormalized: string;
  amount: string;
  kind: TransactionKind;
  currency: string;
  // Classification is deliberately not performed here. Downstream starts at 기타.
  category: Category;
}

export interface CsvParseResult {
  encoding: CsvEncoding | null;
  headers: string[];
  transactions: ParsedTransaction[];
  totalRows: number;
  skippedRows: number;
  minDate: string | null;
  maxDate: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  errorCode: CsvErrorCode | null;
}

interface DecodedCsv {
  encoding: CsvEncoding;
  text: string;
}

interface DelimitedRecords {
  records: string[][];
  error: boolean;
}

interface AmountParts {
  negative: boolean;
  integer: string;
  fraction: string;
}

const DELIMITERS = [",", ";", "\t", "|"] as const;
const MAX_MERCHANT_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const DEFAULT_CURRENCY = "KRW";

function emptyProfile(
  errorCode: CsvErrorCode,
  encoding: CsvEncoding | null = null,
): CsvProfile {
  return {
    encoding,
    headers: [],
    rows: [],
    rowCount: 0,
    errorCode,
  };
}

function emptyParseResult(
  profile: Pick<CsvProfile, "encoding" | "headers" | "rowCount" | "errorCode">,
  skippedRows = 0,
): CsvParseResult {
  return {
    encoding: profile.encoding,
    headers: profile.headers,
    transactions: [],
    totalRows: profile.rowCount,
    skippedRows,
    minDate: null,
    maxDate: null,
    dateRange: { start: null, end: null },
    errorCode: profile.errorCode,
  };
}

function toBytes(input: Uint8Array | ArrayBuffer): Uint8Array {
  if (input instanceof Uint8Array) {
    return input;
  }

  return new Uint8Array(input);
}

function decodeBytes(bytes: Uint8Array): DecodedCsv | CsvProfile {
  if (bytes.byteLength === 0) {
    return emptyProfile("empty_file");
  }

  try {
    return {
      encoding: "utf-8",
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    // EUC-KR is attempted only after strict UTF-8 decoding fails. An invalid
    // byte sequence for both codecs is reported without exposing file data.
    try {
      return {
        encoding: "euc-kr",
        text: new TextDecoder("euc-kr", { fatal: true }).decode(bytes),
      };
    } catch {
      return emptyProfile("encoding_error");
    }
  }
}

function hasContent(value: string): boolean {
  return value.replace(/^\uFEFF/, "").trim().length > 0;
}

function parseDelimited(text: string, delimiter: string): DelimitedRecords {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterClosingQuote = false;

  const finishRecord = () => {
    if (record.length === 0 && field.length === 0 && !afterClosingQuote) {
      return;
    }

    record.push(field);
    records.push(record);
    record = [];
    field = "";
    afterClosingQuote = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character !== '"') {
        field += character;
        continue;
      }

      if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = false;
        afterClosingQuote = true;
      }
      continue;
    }

    if (afterClosingQuote) {
      if (character === delimiter) {
        record.push(field);
        field = "";
        afterClosingQuote = false;
      } else if (character === "\r" || character === "\n") {
        finishRecord();
        if (character === "\r" && text[index + 1] === "\n") {
          index += 1;
        }
      } else if (/\s/u.test(character)) {
        // Whitespace between a closing quote and the next separator is benign.
      } else {
        return { records: [], error: true };
      }
      continue;
    }

    if (character === '"') {
      if (field.length !== 0) {
        return { records: [], error: true };
      }
      inQuotes = true;
    } else if (character === delimiter) {
      record.push(field);
      field = "";
    } else if (character === "\r" || character === "\n") {
      finishRecord();
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    return { records: [], error: true };
  }

  if (record.length !== 0 || field.length !== 0 || afterClosingQuote) {
    finishRecord();
  }

  return { records, error: false };
}

function scoreRecords(records: string[][]): number {
  const headerLength = records[0]?.length ?? 0;
  if (headerLength === 0) {
    return -1;
  }

  const consistentRows = records
    .slice(1)
    .filter((record) => record.length === headerLength).length;
  const multiColumnRows = records.filter((record) => record.length > 1).length;

  // Consistency is weighted more heavily than delimiter frequency. This keeps
  // comma-decimal amounts from making a semicolon-delimited file look comma-
  // delimited.
  return headerLength * 100_000 + consistentRows * 100 + multiColumnRows;
}

function selectRecords(text: string): DelimitedRecords {
  let best: DelimitedRecords | null = null;
  let bestScore = -1;

  for (const delimiter of DELIMITERS) {
    const candidate = parseDelimited(text, delimiter);
    if (candidate.error) {
      continue;
    }

    const score = scoreRecords(candidate.records);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best ?? { records: [], error: true };
}

function normalizedHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim();
}

function recordsToProfile(decoded: DecodedCsv): CsvProfile {
  if (!hasContent(decoded.text)) {
    return emptyProfile("empty_file", decoded.encoding);
  }

  const selected = selectRecords(decoded.text);
  if (selected.error || selected.records.length === 0) {
    return emptyProfile("parse_failed", decoded.encoding);
  }

  const headers = selected.records[0].map(normalizedHeader);
  if (
    headers.length === 0 ||
    headers.some((header) => header.length === 0) ||
    headers.length > MAX_COLUMNS ||
    new Set(headers).size !== headers.length
  ) {
    return emptyProfile("parse_failed", decoded.encoding);
  }

  const dataRows = selected.records.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return {
      encoding: decoded.encoding,
      headers,
      rows: [],
      rowCount: dataRows.length,
      errorCode: "parse_failed",
    };
  }

  const rows: Array<Record<string, string>> = [];
  for (const dataRow of dataRows) {
    if (dataRow.length !== headers.length || dataRow.length > MAX_COLUMNS) {
      return {
        encoding: decoded.encoding,
        headers,
        rows: [],
        rowCount: dataRows.length,
        errorCode: "parse_failed",
      };
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = dataRow[index];
    });
    rows.push(row);
  }

  return {
    encoding: decoded.encoding,
    headers,
    rows,
    rowCount: rows.length,
    errorCode: null,
  };
}

/** Decode and profile a CSV without applying or inferring a column mapping. */
export function profileCsv(input: Uint8Array | ArrayBuffer | string): CsvProfile {
  if (typeof input === "string") {
    return recordsToProfile({ encoding: "utf-8", text: input });
  }

  const decoded = decodeBytes(toBytes(input));
  if ("errorCode" in decoded) {
    return decoded;
  }

  return recordsToProfile(decoded);
}

function columnIndex(profile: CsvProfile, column: string | null | undefined): number {
  if (!column) {
    return -1;
  }
  return profile.headers.indexOf(column);
}

function resolveDateColumn(mapping: CsvColumnMapping): string | undefined {
  return mapping.date ?? mapping.dateColumn;
}

function resolveDescriptionColumn(mapping: CsvColumnMapping): string | undefined {
  return mapping.description ?? mapping.descriptionColumn;
}

function resolveCurrencyColumn(mapping: CsvColumnMapping): string | null | undefined {
  return mapping.currency ?? mapping.currencyColumn;
}

function resolveKindColumn(mapping: CsvColumnMapping): string | null | undefined {
  return mapping.kind ?? mapping.typeColumn;
}

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function formatDate(yearText: string, monthText: string, dayText: string): string | null {
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !validCalendarDate(year, month, day)) {
    return null;
  }

  return `${yearText.padStart(4, "0")}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}`;
}

function normalizeDate(value: string): string | null {
  const text = value.trim().normalize("NFKC");
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:$|\s|T)/u.exec(text);
  if (match) {
    return formatDate(match[1], match[2], match[3]);
  }

  match = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일?$/u.exec(text);
  if (match) {
    return formatDate(match[1], match[2], match[3]);
  }

  match = /^(\d{4})(\d{2})(\d{2})$/u.exec(text);
  if (match) {
    return formatDate(match[1], match[2], match[3]);
  }

  return null;
}

function removeCurrencyNotation(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/(?:KRW|USD|EUR|JPY|GBP)/giu, "")
    .replace(/[₩$€£¥₹]/gu, "")
    .replace(/[\s']/gu, "");
}

function validGroupedInteger(parts: string[]): boolean {
  return (
    parts.length > 1 &&
    parts[0].length >= 1 &&
    parts[0].length <= 3 &&
    parts.every((part, index) => index === 0 ? /^\d{1,3}$/u.test(part) : /^\d{3}$/u.test(part))
  );
}

function parseAmountParts(value: string): AmountParts | null {
  let text = value.trim();
  if (text.length === 0) {
    return null;
  }

  let negative = false;
  const parenthesized = text.startsWith("(") && text.endsWith(")");
  if (parenthesized) {
    negative = true;
    text = text.slice(1, -1).trim();
  } else if (text.includes("(") || text.includes(")")) {
    return null;
  }

  if (text.startsWith("+") || text.startsWith("-")) {
    if (text.startsWith("-")) {
      negative = !negative;
    }
    text = text.slice(1);
  }

  if (text.includes("+") || text.includes("-")) {
    return null;
  }

  text = removeCurrencyNotation(text);
  if (!/^[\d.,]+$/u.test(text)) {
    return null;
  }

  const dotCount = (text.match(/\./gu) ?? []).length;
  const commaCount = (text.match(/,/gu) ?? []).length;
  let integer = text;
  let fraction = "";

  if (dotCount > 0 && commaCount > 0) {
    const decimalSeparator = text.lastIndexOf(".") > text.lastIndexOf(",") ? "." : ",";
    const groupingSeparator = decimalSeparator === "." ? "," : ".";
    const decimalParts = text.split(decimalSeparator);
    if (decimalParts.length !== 2) {
      return null;
    }
    integer = decimalParts[0].split(groupingSeparator).join("");
    fraction = decimalParts[1];
  } else if (dotCount > 0 || commaCount > 0) {
    const separator = dotCount > 0 ? "." : ",";
    const parts = text.split(separator);
    if (parts.length > 1 && validGroupedInteger(parts)) {
      integer = parts.join("");
    } else if (parts.length === 2 && parts[1].length <= 2) {
      integer = parts[0];
      fraction = parts[1];
    } else {
      return null;
    }
  }

  if (!/^\d+$/u.test(integer) || !/^\d*$/u.test(fraction) || fraction.length > 2) {
    return null;
  }

  const canonicalInteger = integer.replace(/^0+(?=\d)/u, "");
  return {
    negative,
    integer: canonicalInteger,
    fraction: fraction.padEnd(2, "0"),
  };
}

/**
 * Amounts retain the sign present in the source text. No floating-point
 * conversion or arithmetic is used; values are canonical decimal strings
 * with two fractional digits for numeric(14,2) storage.
 */
export function normalizeAmount(value: string): string | null {
  const parts = parseAmountParts(value);
  if (!parts) {
    return null;
  }

  const isZero = /^0+$/u.test(parts.integer) && /^0+$/u.test(parts.fraction);
  return `${parts.negative && !isZero ? "-" : ""}${parts.integer}.${parts.fraction}`;
}

function decimalToParts(value: string): AmountParts {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction] = unsigned.split(".");
  return { negative, integer, fraction };
}

function compareUnsignedDecimalParts(left: AmountParts, right: AmountParts): number {
  if (left.integer.length !== right.integer.length) {
    return left.integer.length > right.integer.length ? 1 : -1;
  }

  if (left.integer !== right.integer) {
    return left.integer > right.integer ? 1 : -1;
  }

  return left.fraction > right.fraction ? 1 : left.fraction < right.fraction ? -1 : 0;
}

function addUnsignedDecimalParts(left: AmountParts, right: AmountParts): string {
  const leftInteger = left.integer.padStart(Math.max(left.integer.length, right.integer.length), "0");
  const rightInteger = right.integer.padStart(leftInteger.length, "0");
  const leftDigits = `${leftInteger}${left.fraction}`;
  const rightDigits = `${rightInteger}${right.fraction}`;
  let carry = 0;
  let output = "";

  for (let index = leftDigits.length - 1; index >= 0; index -= 1) {
    const sum = leftDigits.charCodeAt(index) - 48 + (rightDigits.charCodeAt(index) - 48) + carry;
    output = String(sum % 10) + output;
    carry = sum >= 10 ? 1 : 0;
  }
  if (carry > 0) {
    output = String(carry) + output;
  }

  const integerLength = output.length - 2;
  return `${output.slice(0, integerLength).replace(/^0+(?=\d)/u, "")}.${output.slice(integerLength)}`;
}

function addDecimalStrings(left: string, right: string): string {
  const leftParts = decimalToParts(left);
  const rightParts = decimalToParts(right);
  if (leftParts.negative === rightParts.negative) {
    const sum = addUnsignedDecimalParts(leftParts, rightParts);
    return leftParts.negative && sum !== "0.00" ? `-${sum}` : sum;
  }

  const comparison = compareUnsignedDecimalParts(leftParts, rightParts);
  if (comparison === 0) {
    return "0.00";
  }

  const larger = comparison > 0 ? leftParts : rightParts;
  const smaller = comparison > 0 ? rightParts : leftParts;
  const leftDigits = `${larger.integer}${larger.fraction}`;
  const rightDigits = `${smaller.integer.padStart(larger.integer.length, "0")}${smaller.fraction}`;
  let borrow = 0;
  let output = "";

  for (let index = leftDigits.length - 1; index >= 0; index -= 1) {
    let difference = leftDigits.charCodeAt(index) - 48 - borrow - (rightDigits.charCodeAt(index) - 48);
    if (difference < 0) {
      difference += 10;
      borrow = 1;
    } else {
      borrow = 0;
    }
    output = String(difference) + output;
  }

  const integerLength = output.length - 2;
  const result = `${output.slice(0, integerLength).replace(/^0+(?=\d)/u, "")}.${output.slice(integerLength)}`;
  const negative = comparison > 0 ? leftParts.negative : rightParts.negative;
  return negative && result !== "0.00" ? `-${result}` : result;
}

function negateDecimal(value: string): string {
  return value === "0.00" ? value : value.startsWith("-") ? value.slice(1) : `-${value}`;
}

function sanitizeText(value: string, maxLength: number): string {
  return Array.from(
    value
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f-\u009f]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim(),
  )
    .slice(0, maxLength)
    .join("");
}

/** Normalize only the merchant label; it is not a category classifier. */
export function normalizeMerchant(value: string): string {
  const sanitized = sanitizeText(value, MAX_DESCRIPTION_LENGTH)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  return Array.from(sanitized).slice(0, MAX_MERCHANT_LENGTH).join("");
}

function defaultResultForProfile(profile: CsvProfile): CsvParseResult {
  return emptyParseResult(profile);
}

function buildMappingIndexes(
  profile: CsvProfile,
  mapping: CsvColumnMapping,
): {
  date: number;
  description: number;
  currency: number;
  kind: number;
  amount: { mode: "single"; index: number; debitSign: "positive" | "negative" } | { mode: "split"; debitIndex: number; creditIndex: number };
} | null {
  const date = columnIndex(profile, resolveDateColumn(mapping));
  const description = columnIndex(profile, resolveDescriptionColumn(mapping));
  const currency = columnIndex(profile, resolveCurrencyColumn(mapping));
  const kind = columnIndex(profile, resolveKindColumn(mapping));
  if (date < 0 || description < 0) {
    return null;
  }

  if (typeof mapping.amount === "string") {
    const amount = columnIndex(profile, mapping.amount);
    return amount < 0 ? null : { date, description, currency, kind, amount: { mode: "single", index: amount, debitSign: "negative" } };
  }

  if (mapping.amount.mode === "signed_single") {
    const amount = columnIndex(profile, mapping.amount.amountColumn);
    return amount < 0 ? null : { date, description, currency, kind, amount: { mode: "single", index: amount, debitSign: mapping.amount.debitSign } };
  }

  const debitIndex = columnIndex(profile, mapping.amount.debitColumn);
  const creditIndex = columnIndex(profile, mapping.amount.creditColumn);
  return debitIndex < 0 || creditIndex < 0
    ? null
    : { date, description, currency, kind, amount: { mode: "split", debitIndex, creditIndex } };
}

function resolveKind(
  rawValue: string,
  mapping: CsvColumnMapping,
): TransactionKind | null {
  const value = rawValue.trim();
  const mapped = mapping.kindMap?.[value] ?? mapping.kindValueMap?.[value];
  if (mapped) {
    return mapped;
  }

  if (!mapping.kindMap && !mapping.kindValueMap) {
    const lower = value.toLowerCase();
    if (lower === "debit" || lower === "credit") {
      return lower;
    }
  }

  return null;
}

function resultFromTransactions(
  profile: CsvProfile,
  transactions: ParsedTransaction[],
  skippedRows: number,
): CsvParseResult {
  const minDate = transactions.reduce<string | null>(
    (current, transaction) => current === null || transaction.occurredOn < current ? transaction.occurredOn : current,
    null,
  );
  const maxDate = transactions.reduce<string | null>(
    (current, transaction) => current === null || transaction.occurredOn > current ? transaction.occurredOn : current,
    null,
  );

  return {
    encoding: profile.encoding,
    headers: profile.headers,
    transactions,
    totalRows: profile.rowCount,
    skippedRows,
    minDate,
    maxDate,
    dateRange: { start: minDate, end: maxDate },
    errorCode: null,
  };
}

/** Apply a caller-provided mapping and normalize valid rows to safe primitives. */
export function normalizeTransactions(
  profile: CsvProfile,
  mapping: CsvColumnMapping,
): CsvParseResult {
  if (profile.errorCode) {
    return defaultResultForProfile(profile);
  }

  const indexes = buildMappingIndexes(profile, mapping);
  if (!indexes) {
    return { ...emptyParseResult(profile), errorCode: "parse_failed" };
  }

  const transactions: ParsedTransaction[] = [];
  let skippedRows = 0;

  for (const row of profile.rows) {
    const occurredOn = normalizeDate(row[profile.headers[indexes.date]] ?? "");
    const description = sanitizeText(row[profile.headers[indexes.description]] ?? "", MAX_DESCRIPTION_LENGTH);
    let amount: string | null;
    let kind: TransactionKind | null = null;

    if (indexes.amount.mode === "single") {
      amount = normalizeAmount(row[profile.headers[indexes.amount.index]] ?? "");
      if (amount !== null && indexes.kind < 0) {
        const isNegative = amount.startsWith("-");
        kind = indexes.amount.debitSign === "negative" ? (isNegative ? "debit" : "credit") : (isNegative ? "credit" : "debit");
      }
    } else {
      const debitValue = row[profile.headers[indexes.amount.debitIndex]] ?? "";
      const creditValue = row[profile.headers[indexes.amount.creditIndex]] ?? "";
      const debit = debitValue.trim().length === 0 ? "0.00" : normalizeAmount(debitValue);
      const credit = creditValue.trim().length === 0 ? "0.00" : normalizeAmount(creditValue);
      amount = debit === null || credit === null ? null : addDecimalStrings(debit, negateDecimal(credit));
      if (amount !== null && indexes.kind < 0) {
        kind = debit !== "0.00" ? "debit" : "credit";
      }
    }

    if (indexes.kind >= 0) {
      kind = resolveKind(row[profile.headers[indexes.kind]] ?? "", mapping);
    }

    const currencyValue = indexes.currency >= 0
      ? (row[profile.headers[indexes.currency]] ?? "").trim().toUpperCase()
      : (mapping.defaultCurrency ?? DEFAULT_CURRENCY).trim().toUpperCase();
    const currency = currencyValue.length === 0 ? (mapping.defaultCurrency ?? DEFAULT_CURRENCY).toUpperCase() : currencyValue;

    if (
      occurredOn === null ||
      amount === null ||
      kind === null ||
      !/^[A-Z]{3}$/u.test(currency)
    ) {
      skippedRows += 1;
      continue;
    }

    transactions.push({
      occurredOn,
      description,
      merchantNormalized: normalizeMerchant(description),
      amount,
      kind,
      currency,
      category: CATEGORIES[CATEGORIES.length - 1],
    });
  }

  // A small number of bad rows is isolated. If corruption is widespread, the
  // caller gets a deterministic parse_failed result and can request re-upload.
  if (profile.rowCount > 0 && skippedRows * 100 > profile.rowCount * 5) {
    return {
      ...resultFromTransactions(profile, [], skippedRows),
      errorCode: "parse_failed",
    };
  }

  return resultFromTransactions(profile, transactions, skippedRows);
}

/** Decode, parse, and apply an explicit mapping in one pure function. */
export function parseCsv(
  input: Uint8Array | ArrayBuffer | string,
  mapping: CsvColumnMapping,
): CsvParseResult {
  const profile = profileCsv(input);
  return normalizeTransactions(profile, mapping);
}
