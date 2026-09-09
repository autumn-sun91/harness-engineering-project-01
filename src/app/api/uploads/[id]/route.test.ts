import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("../../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { GET } from "./route";

function detailSupabase(options: { row?: Record<string, unknown> | null; report?: unknown }) {
  const maybeSingle = vi.fn(async () => ({ data: options.row ?? null, error: null }));
  const eq = vi.fn(() => ({ eq, maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const rpc = vi.fn(async (name: string) => ({
    data: name === "get_upload_report" ? options.report : null,
    error: null,
  }));
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-id" } }, error: null })) },
    from: vi.fn(() => ({ select })),
    rpc,
    maybeSingle,
    eq,
  };
}

const completedRow = {
  id: "upload-id",
  user_id: "user-id",
  original_filename: "statement.csv",
  file_size: 123,
  row_count: 10,
  skipped_row_count: 0,
  status: "completed",
  error_code: null,
  scope_start: "2026-01-01",
  scope_end: "2026-09-01",
  currency: "KRW",
  retry_count: 0,
  uploaded_at: "2026-09-09T00:00:00.000Z",
  started_at: "2026-09-09T00:00:01.000Z",
  completed_at: "2026-09-09T00:00:02.000Z",
};

describe("GET /api/uploads/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the get_upload_report RPC value without application trimming", async () => {
    const report = {
      scope: "full",
      aggregates: { summary: { totalSpending: "100.00" } },
      interpretation: {
        summary: "summary",
        savings: { items: [{ title: "one" }, { title: "two" }], totalCount: 2, locked: false },
        anomalies: { items: [{ title: "anomaly" }], totalCount: 1, locked: false },
      },
      sentinel: "db-owned-shape",
    };
    const supabase = detailSupabase({ row: completedRow, report });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await GET(
      new NextRequest("http://localhost/api/uploads/upload-id"),
      { params: Promise.resolve({ id: "upload-id" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      uploadId: "upload-id",
      status: "completed",
      errorCode: null,
      report,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("get_upload_report", { upload_id: "upload-id" });
  });

  it("rejects another user's upload as not_found", async () => {
    const supabase = detailSupabase({ row: null });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await GET(
      new NextRequest("http://localhost/api/uploads/other-user-upload"),
      { params: Promise.resolve({ id: "other-user-upload" }) },
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("not_found");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
