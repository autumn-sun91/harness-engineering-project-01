import { describe, expect, it } from "vitest";

import {
  MAX_COLUMNS,
  MAX_ROWS,
} from "../../types";
import {
  normalizeAmount,
  normalizeTransactions,
  parseCsv,
  profileCsv,
  type CsvColumnMapping,
} from "./index";

const mapping: CsvColumnMapping = {
  date: "Date",
  amount: "Amount",
  description: "Description",
};

function bytes(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

describe("CSV parser", () => {
  it("parses UTF-8 CSV with quoted commas and newlines", () => {
    const result = parseCsv(
      `Date,Description,Amount\r\n2026-01-02,"Cafe, Main\nbranch",1,234.56\r\n2026/01/03,Bookstore,(2,000)`,
      mapping,
    );

    expect(result.errorCode).toBe("parse_failed");
  });

  it("parses UTF-8 CSV with quoted amount fields", () => {
    const result = parseCsv(
      `Date,Description,Amount\r\n2026-01-02,"Cafe, Main\nbranch","1,234.56"\r\n2026/01/03,Bookstore,"(2,000)"`,
      mapping,
    );

    expect(result).toMatchObject({
      encoding: "utf-8",
      totalRows: 2,
      skippedRows: 0,
      minDate: "2026-01-02",
      maxDate: "2026-01-03",
      errorCode: null,
    });
    expect(result.transactions).toEqual([
      expect.objectContaining({
        occurredOn: "2026-01-02",
        description: "Cafe, Main branch",
        merchantNormalized: "cafe main branch",
        amount: "1234.56",
        kind: "credit",
        currency: "KRW",
      }),
      expect.objectContaining({
        occurredOn: "2026-01-03",
        amount: "-2000.00",
        kind: "debit",
      }),
    ]);
  });

  it("decodes EUC-KR bytes without filesystem or network access", () => {
    const result = parseCsv(
      bytes([
        ...Buffer.from("Date,Description,Amount\n", "ascii"),
        ...Buffer.from("2026-01-01,", "ascii"),
        0xb0,
        0xa1,
        0xb3,
        0xaa,
        0xb4,
        0xd9,
        ...Buffer.from(",1000\n", "ascii"),
      ]),
      mapping,
    );

    expect(result).toMatchObject({
      encoding: "euc-kr",
      totalRows: 1,
      skippedRows: 0,
      errorCode: null,
    });
    expect(result.transactions[0]).toMatchObject({
      description: "가나다",
      merchantNormalized: "가나다",
      amount: "1000.00",
    });
  });

  it("returns empty_file for an empty byte array", () => {
    expect(parseCsv(new Uint8Array(), mapping)).toMatchObject({
      transactions: [],
      totalRows: 0,
      skippedRows: 0,
      errorCode: "empty_file",
    });
  });

  it("keeps a header-only file as a valid empty profile", () => {
    const result = parseCsv("Date,Description,Amount\n", mapping);

    expect(result).toMatchObject({
      headers: ["Date", "Description", "Amount"],
      transactions: [],
      totalRows: 0,
      skippedRows: 0,
      minDate: null,
      maxDate: null,
      errorCode: null,
    });
  });

  it("normalizes dot-decimal, comma-decimal, and currency amounts exactly", () => {
    expect(normalizeAmount("1,234.56")).toBe("1234.56");
    expect(normalizeAmount("1.234,56")).toBe("1234.56");
    expect(normalizeAmount("₩1,234")).toBe("1234.00");
  });

  it("preserves a parenthesized negative amount without floating-point arithmetic", () => {
    expect(normalizeAmount("(1,234)")).toBe("-1234.00");
    expect(normalizeAmount("-0.10")).toBe("-0.10");
  });

  it("combines debit and credit columns with decimal-string arithmetic", () => {
    const profile = profileCsv(
      "Date,Description,Debit,Credit\n2026-01-01,Store,100,\n2026-01-02,Refund,,20",
    );
    const result = normalizeTransactions(profile, {
      date: "Date",
      description: "Description",
      amount: {
        mode: "debit_credit_split",
        debitColumn: "Debit",
        creditColumn: "Credit",
      },
    });

    expect(result.transactions.map(({ amount }) => amount)).toEqual([
      "100.00",
      "-20.00",
    ]);
  });

  it("skips an invalid row and reports its count when the failure rate is at most 5%", () => {
    const rows = Array.from(
      { length: 20 },
      (_, index) => `2026-01-${String(index + 1).padStart(2, "0")},Store ${index},100`,
    );
    rows.push("not-a-date,Broken,not-an-amount");

    const result = parseCsv(`Date,Description,Amount\n${rows.join("\n")}`, mapping);

    expect(result).toMatchObject({
      totalRows: 21,
      skippedRows: 1,
      errorCode: null,
    });
    expect(result.transactions).toHaveLength(20);
  });

  it("fails the whole parse when invalid rows exceed the 5% tolerance", () => {
    const result = parseCsv(
      "Date,Description,Amount\n2026-01-01,Valid,100\nnot-a-date,Broken,not-an-amount",
      mapping,
    );

    expect(result).toMatchObject({
      transactions: [],
      totalRows: 2,
      skippedRows: 1,
      errorCode: "parse_failed",
    });
  });

  it("rejects more than the configured row or column limit", () => {
    const tooManyRows = Array.from(
      { length: MAX_ROWS + 1 },
      () => "2026-01-01,Store,100",
    ).join("\n");
    const rowResult = parseCsv(`Date,Description,Amount\n${tooManyRows}`, mapping);
    expect(rowResult.errorCode).toBe("parse_failed");

    const headers = Array.from({ length: MAX_COLUMNS + 1 }, (_, index) => `C${index}`);
    const columnResult = profileCsv(`${headers.join(",")}\nvalue`);
    expect(columnResult.errorCode).toBe("parse_failed");
  });

  it("supports semicolon-delimited quoted CSV and never infers the column mapping", () => {
    const result = parseCsv(
      "Date;Description;Amount\n2026.02.01;\"Store; Seoul\";\"1.234,56\"",
      mapping,
    );
    expect(result.transactions[0]).toMatchObject({
      occurredOn: "2026-02-01",
      description: "Store; Seoul",
      amount: "1234.56",
    });

    const wrongMapping = parseCsv("Date,Description,Amount\n2026-02-01,Store,100", {
      date: "날짜",
      amount: "금액",
      description: "적요",
    });
    expect(wrongMapping.errorCode).toBe("parse_failed");
  });

  it("removes controls and special characters from the merchant classifier input", () => {
    const result = parseCsv(
      `Date,Description,Amount\n2026-01-01,"  Café!!!\u0000  ONLINE  ",100`,
      mapping,
    );

    expect(result.transactions[0].merchantNormalized).toBe("café online");
    expect(result.transactions[0].merchantNormalized).not.toContain("\u0000");
  });
});
