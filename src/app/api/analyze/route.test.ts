import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  createAnalysisRepositoryForAccessToken: vi.fn(() => ({
    transitionUpload: vi.fn(),
    insertTransactions: vi.fn(),
    updateTransactionCategories: vi.fn(),
    saveAnalysisResult: vi.fn(),
  })),
  createClaudeService: vi.fn(() => ({
    inferColumnMapping: vi.fn(),
    classifyMerchants: vi.fn(),
    interpretScopes: vi.fn(),
  })),
  processUpload: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after: mocks.after };
});
vi.mock("../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../lib/analysis/analysis-repository", () => ({
  createAnalysisRepositoryForAccessToken: mocks.createAnalysisRepositoryForAccessToken,
}));
vi.mock("../../../lib/analysis/process-upload", () => ({
  processUpload: mocks.processUpload,
}));
vi.mock("../../../services/claude", () => ({
  createClaudeService: mocks.createClaudeService,
}));

import { POST } from "./route";

type SupabaseMock = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };
  rpc: ReturnType<typeof vi.fn>;
};

function supabaseMock(options: {
  user?: { id: string } | null;
  accessToken?: string | null;
  rpcData?: unknown;
  rpcError?: { message: string } | null;
} = {}): SupabaseMock {
  const user = Object.prototype.hasOwnProperty.call(options, "user")
    ? options.user ?? null
    : { id: "user-id" };
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      getSession: vi.fn(async () => ({
        data: { session: options.accessToken === null ? null : { access_token: options.accessToken ?? "access-token" } },
        error: null,
      })),
    },
    rpc: vi.fn(async () => ({
      data: options.rpcData ?? [{ upload_id: "upload-id", error_code: null }],
      error: options.rpcError ?? null,
    })),
  };
}

function request(file: File): NextRequest {
  const body = new FormData();
  body.set("file", file);
  return new NextRequest("http://localhost/api/analyze", { method: "POST", body });
}

function csvFile(content = "Date,Description,Amount\n2026-09-01,Store,100") : File {
  return new File([content], "statement.csv", { type: "text/csv" });
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.after.mockImplementation((task: () => unknown) => {
      void task;
    });
    mocks.createServerSupabaseClient.mockResolvedValue(supabaseMock());
  });

  it("rejects unauthenticated requests before reading or reserving the file", async () => {
    const supabase = supabaseMock({ user: null });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(request(csvFile()));

    expect(response.status).toBe(401);
    expect(await responseBody(response)).toEqual({
      error: { code: "unauthorized", message: expect.any(String) },
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("rejects files over the 4,000,000 byte limit before reserving an upload", async () => {
    const oversized = new File([new Uint8Array(4_000_001)], "statement.csv", { type: "text/csv" });
    const supabase = supabaseMock();
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(request(oversized));

    expect(response.status).toBe(413);
    expect((await responseBody(response)).error).toMatchObject({ code: "file_too_large" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["upload_limit_reached", 409],
    ["analysis_in_progress", 409],
  ] as const)("maps reserve_upload %s without starting analysis", async (errorCode, status) => {
    const supabase = supabaseMock({ rpcData: [{ upload_id: null, error_code: errorCode }] });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(request(csvFile()));

    expect(response.status).toBe(status);
    expect((await responseBody(response)).error).toMatchObject({ code: errorCode });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("returns 202 immediately and registers processUpload with after", async () => {
    let scheduled: (() => Promise<void>) | undefined;
    mocks.after.mockImplementation((task: () => Promise<void>) => {
      scheduled = task;
    });
    const supabase = supabaseMock();
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const responsePromise = POST(request(csvFile()));
    const response = await responsePromise;

    expect(response.status).toBe(202);
    expect(await responseBody(response)).toEqual({ uploadId: "upload-id" });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.processUpload).not.toHaveBeenCalled();

    await scheduled?.();
    expect(mocks.processUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadId: "upload-id",
        userId: "user-id",
        accessToken: "access-token",
        fileBytes: expect.any(Uint8Array),
      }),
      expect.objectContaining({
        repository: expect.any(Object),
        llm: expect.any(Object),
      }),
    );
  });

  it("does not reserve an upload when the file encoding is invalid", async () => {
    const invalidEncoding = new File([new Uint8Array([0xff, 0xfe, 0xfd])], "statement.csv", { type: "text/csv" });
    const supabase = supabaseMock();
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const response = await POST(request(invalidEncoding));

    expect(response.status).toBe(400);
    expect((await responseBody(response)).error).toMatchObject({ code: "encoding_error" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("rejects a non-CSV file and an empty file before reserving an upload", async () => {
    const supabase = supabaseMock();
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);

    const invalidTypeResponse = await POST(request(new File(["data"], "statement.txt", { type: "text/plain" })));
    const emptyResponse = await POST(request(new File([], "statement.csv", { type: "text/csv" })));

    expect(invalidTypeResponse.status).toBe(400);
    expect((await responseBody(invalidTypeResponse)).error).toMatchObject({ code: "invalid_file_type" });
    expect(emptyResponse.status).toBe(400);
    expect((await responseBody(emptyResponse)).error).toMatchObject({ code: "empty_file" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
