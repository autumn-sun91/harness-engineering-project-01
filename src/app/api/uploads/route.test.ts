import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { GET } from "./route";

describe("GET /api/uploads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only the authenticated user's upload metadata", async () => {
    const order = vi.fn(async () => ({
      data: [{
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
      }],
      error: null,
    }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-id" } }, error: null })) },
      from,
    };
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      uploads: [expect.objectContaining({ id: "upload-id", userId: "user-id", status: "completed" })],
    });
    expect(from).toHaveBeenCalledWith("csv_uploads");
    expect(eq).toHaveBeenCalledWith("user_id", "user-id");
    expect(order).toHaveBeenCalledWith("uploaded_at", { ascending: false });
  });

  it("rejects an unauthenticated request", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("unauthorized");
  });
});
