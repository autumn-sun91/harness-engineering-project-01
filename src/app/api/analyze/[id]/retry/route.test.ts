import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  retryUploadAnalysis: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after: mocks.after };
});
vi.mock("../../../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../../../lib/analysis/process-upload", () => ({
  retryUploadAnalysis: mocks.retryUploadAnalysis,
}));

import { POST } from "./route";

function supabaseMock(rpcData: unknown) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-id" } }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: { access_token: "access-token" } }, error: null })),
    },
    rpc: vi.fn(async () => ({ data: rpcData, error: null })),
  };
}

describe("POST /api/analyze/[id]/retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.after.mockImplementation((task: () => unknown) => {
      void task;
    });
    mocks.retryUploadAnalysis.mockResolvedValue(undefined);
  });

  it("maps the fourth retry claim to retry_limit_exceeded", async () => {
    const supabase = supabaseMock([{ upload_id: null, error_code: "retry_limit_exceeded" }]);
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(new NextRequest("http://localhost/api/analyze/upload-id/retry", { method: "POST" }), {
      params: Promise.resolve({ id: "upload-id" }),
    });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatchObject({ code: "retry_limit_exceeded" });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("claims the retry through the RPC and returns 202 without waiting", async () => {
    let scheduled: (() => Promise<void>) | undefined;
    mocks.after.mockImplementation((task: () => Promise<void>) => {
      scheduled = task;
    });
    const supabase = supabaseMock([{ upload_id: "upload-id", error_code: null }]);
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(new NextRequest("http://localhost/api/analyze/upload-id/retry", { method: "POST" }), {
      params: Promise.resolve({ id: "upload-id" }),
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ uploadId: "upload-id" });
    expect(supabase.rpc).toHaveBeenCalledWith("claim_analysis_retry", { upload_id: "upload-id" });
    expect(mocks.retryUploadAnalysis).not.toHaveBeenCalled();

    await scheduled?.();
    expect(mocks.retryUploadAnalysis).toHaveBeenCalledWith({
      uploadId: "upload-id",
      userId: "user-id",
      accessToken: "access-token",
    });
  });
});
