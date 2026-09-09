import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { UPLOAD_STATUSES, type Transaction } from "../../types";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0005_supabase_schema.sql"),
  "utf8",
);
const billingMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0006_billing.sql"),
  "utf8",
);

describe("Supabase schema contract", () => {
  it("keeps the database upload statuses aligned with the domain type", () => {
    for (const status of UPLOAD_STATUSES) {
      expect(migration).toContain(`'${status}'`);
    }

    expect(migration).toContain(
      "check (status in ('uploading', 'parsing', 'analyzing', 'completed', 'failed'))",
    );
    expect(migration).not.toContain("'partial'");
  });

  it("defines the four domain tables and the decimal transaction amount", () => {
    for (const table of [
      "subscriptions",
      "csv_uploads",
      "transactions",
      "analysis_results",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(migration).toContain("amount numeric(14,2) not null");
    expect(migration).not.toMatch(/amount\s+(real|double precision|float)/i);
    expect(migration).toContain("upload_id uuid primary key references public.csv_uploads(id)");
    expect(migration).toContain("create index transactions_upload_id_idx");
    expect(migration).toContain("create index csv_uploads_user_uploaded_at_idx");
  });

  it("keeps ownership policies explicit and does not grant direct report reads", () => {
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain("with check (auth.uid() = user_id)");
    expect(migration).not.toMatch(/on public\.transactions.*for select/i);
    expect(migration).not.toMatch(/on public\.analysis_results.*for select/i);
    expect(migration).toContain("revoke all on table public.transactions from anon, authenticated");
    expect(migration).toContain("revoke all on table public.analysis_results from anon, authenticated");
  });

  it("exposes an atomic reserve function with an upload-limit signal", () => {
    expect(migration).toContain("create or replace function public.reserve_upload");
    expect(migration).toContain("for update");
    expect(migration).toContain("current_period_end >= now()");
    expect(migration).toContain("'upload_limit_reached'");
    expect(migration).toContain("status <> 'failed'");
    expect(migration).toContain("grant execute on function public.reserve_upload(text, integer) to authenticated");
    expect(migration).toContain("revoke execute on function public.reserve_upload(text, integer) from public");
  });

  it("keeps authenticated subscription return sync behind an RPC", () => {
    expect(billingMigration).toContain("create or replace function public.sync_polar_subscription");
    expect(billingMigration).toContain("auth.uid()");
    expect(billingMigration).toContain("grant execute on function public.sync_polar_subscription");
    expect(billingMigration).toContain("revoke all on function public.sync_polar_subscription");
  });

  it("keeps the transaction shape compatible with the domain type", () => {
    const transaction: Pick<Transaction, "amount" | "kind" | "currency"> = {
      amount: "100.00",
      kind: "debit",
      currency: "KRW",
    };

    expect(transaction.amount).toMatch(/^\d+\.\d{2}$/);
    expect(migration).toContain("kind text not null check (kind in ('debit', 'credit'))");
    expect(migration).toContain("currency char(3) not null");
  });
});
