import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "../../../services/supabase/server";

const METADATA_COLUMNS = [
  "id",
  "user_id",
  "original_filename",
  "file_size",
  "row_count",
  "skipped_row_count",
  "status",
  "error_code",
  "scope_start",
  "scope_end",
  "currency",
  "retry_count",
  "uploaded_at",
  "started_at",
  "completed_at",
].join(",");

type UploadMetadataRow = Record<string, unknown>;

type SupabaseUploadsClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json({
    error: {
      code,
      message: code === "unauthorized" ? "로그인이 필요합니다." : "업로드 이력을 읽지 못했습니다.",
    },
  }, { status });
}

function metadata(row: UploadMetadataRow): Record<string, unknown> {
  return {
    id: row.id,
    userId: row.user_id,
    originalFilename: row.original_filename,
    fileSize: row.file_size,
    rowCount: row.row_count,
    skippedRowCount: row.skipped_row_count,
    status: row.status,
    errorCode: row.error_code ?? null,
    scopeStart: row.scope_start ?? null,
    scopeEnd: row.scope_end ?? null,
    currency: row.currency ?? null,
    retryCount: row.retry_count,
    uploadedAt: row.uploaded_at,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
  };
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient() as unknown as SupabaseUploadsClient;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { data, error } = await supabase
    .from("csv_uploads")
    .select(METADATA_COLUMNS)
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });
  if (error) {
    return errorResponse("analysis_failed", 500);
  }

  const rows = Array.isArray(data) ? data : [];
  return NextResponse.json({
    uploads: rows
      .filter((row): row is UploadMetadataRow => typeof row === "object" && row !== null)
      .map(metadata),
  });
}
