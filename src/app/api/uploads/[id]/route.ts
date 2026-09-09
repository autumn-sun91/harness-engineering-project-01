import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "../../../../services/supabase/server";

const ACTIVE_STATUSES = new Set(["queued", "uploading", "parsing", "analyzing"]);
const STALE_AFTER_MS = 10 * 60 * 1_000;
const METADATA_COLUMNS = [
  "id",
  "user_id",
  "status",
  "error_code",
  "uploaded_at",
  "started_at",
].join(",");

type UploadRow = Record<string, unknown>;

type SupabaseUploadDetailClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
};

function errorResponse(code: string, status: number): NextResponse {
  const messages: Record<string, string> = {
    unauthorized: "로그인이 필요합니다.",
    not_found: "리포트를 찾을 수 없습니다.",
    analysis_failed: "분석 결과를 읽지 못했습니다.",
  };
  return NextResponse.json({
    error: { code, message: messages[code] ?? messages.analysis_failed },
  }, { status });
}

function asRow(value: unknown): UploadRow | null {
  return typeof value === "object" && value !== null ? value as UploadRow : null;
}

function statusOf(row: UploadRow): string | null {
  return typeof row.status === "string" ? row.status : null;
}

function isStale(row: UploadRow, now: number): boolean {
  const startedAt = typeof row.started_at === "string" ? row.started_at : row.uploaded_at;
  if (typeof startedAt !== "string") {
    return false;
  }
  const timestamp = Date.parse(startedAt);
  return Number.isFinite(timestamp) && now - timestamp >= STALE_AFTER_MS;
}

function detail(row: UploadRow, report: unknown): Record<string, unknown> {
  return {
    uploadId: row.id,
    status: row.status,
    errorCode: row.error_code ?? null,
    report,
  };
}

async function findOwnUpload(
  supabase: SupabaseUploadDetailClient,
  uploadId: string,
  userId: string,
): Promise<{ row: UploadRow | null; error: unknown }> {
  const result = await supabase
    .from("csv_uploads")
    .select(METADATA_COLUMNS)
    .eq("id", uploadId)
    .eq("user_id", userId)
    .maybeSingle();
  return { row: asRow(result.data), error: result.error };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient() as unknown as SupabaseUploadDetailClient;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  let found = await findOwnUpload(supabase, id, user.id);
  if (found.error) {
    return errorResponse("analysis_failed", 500);
  }
  if (!found.row) {
    return errorResponse("not_found", 404);
  }

  let row = found.row;
  if (ACTIVE_STATUSES.has(statusOf(row) ?? "") && isStale(row, Date.now())) {
    const { error } = await supabase.rpc("mark_stale_upload", { upload_id: id });
    if (error) {
      return errorResponse("analysis_failed", 500);
    }
    found = await findOwnUpload(supabase, id, user.id);
    if (found.error) {
      return errorResponse("analysis_failed", 500);
    }
    if (!found.row) {
      return errorResponse("not_found", 404);
    }
    row = found.row;
  }

  const status = statusOf(row);
  if (status === "queued" || status === "uploading" || status === "parsing" || status === "analyzing" || status === "failed") {
    return NextResponse.json(detail(row, null));
  }

  const { data: report, error } = await supabase.rpc("get_upload_report", { upload_id: id });
  if (error) {
    return errorResponse("analysis_failed", 500);
  }
  return NextResponse.json(detail(row, report));
}
