import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { profileCsv } from "../../../lib/csv";
import { createAnalysisRepositoryForAccessToken } from "../../../lib/analysis/analysis-repository";
import { processUpload } from "../../../lib/analysis/process-upload";
import { createClaudeService } from "../../../services/claude";
import { createServerSupabaseClient } from "../../../services/supabase/server";
import { MAX_FILE_SIZE_BYTES, type ApiErrorCode } from "../../../types";

export const runtime = "nodejs";
export const maxDuration = 300;

const ERROR_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  unauthorized: "로그인이 필요합니다.",
  invalid_file_type: "CSV 파일만 올릴 수 있습니다.",
  file_too_large: "파일이 4MB를 넘습니다.",
  empty_file: "파일에 거래 내역이 없습니다.",
  encoding_error: "파일 인코딩을 읽지 못했습니다. UTF-8로 저장한 뒤 다시 올려주세요.",
  parse_failed: "파일을 읽지 못했습니다.",
  upload_limit_reached: "이번 달 업로드 횟수를 모두 썼습니다.",
  analysis_in_progress: "이미 분석 중인 파일이 있습니다. 완료된 뒤 다시 시도해주세요.",
  analysis_failed: "분석에 실패했습니다.",
};

type SupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
    getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
  };
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>
};

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: { code, message: ERROR_MESSAGES[code as ApiErrorCode] ?? "분석에 실패했습니다." } },
    { status },
  );
}

function statusForError(code: string): number {
  if (code === "unauthorized") return 401;
  if (code === "file_too_large") return 413;
  if (code === "upload_limit_reached" || code === "analysis_in_progress") return 409;
  return 400;
}

function rpcRow(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return typeof row === "object" && row !== null ? row as Record<string, unknown> : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function uploadIdFromRpc(data: unknown): { uploadId: string | null; errorCode: string | null } {
  const row = rpcRow(data);
  return {
    uploadId: stringValue(row?.upload_id ?? row?.uploadId),
    errorCode: stringValue(row?.error_code ?? row?.errorCode),
  };
}

async function authenticatedUser(
  supabase: SupabaseAuthClient,
): Promise<{ id: string } | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient() as unknown as SupabaseAuthClient;
  const user = await authenticatedUser(supabase);
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("invalid_file_type", 400);
  }

  const value = formData.get("file");
  if (!(value instanceof File) || !value.name.toLowerCase().endsWith(".csv")) {
    return errorResponse("invalid_file_type", 400);
  }
  if (value.size > MAX_FILE_SIZE_BYTES) {
    return errorResponse("file_too_large", 413);
  }
  if (value.size === 0) {
    return errorResponse("empty_file", 400);
  }

  const fileBytes = new Uint8Array(await value.arrayBuffer());
  const profile = profileCsv(fileBytes);
  if (profile.errorCode !== null) {
    return errorResponse(profile.errorCode, statusForError(profile.errorCode));
  }
  if (profile.rowCount === 0) {
    return errorResponse("empty_file", 400);
  }

  const { data, error } = await supabase.rpc("reserve_upload", {
    file_name: value.name,
    file_size: value.size,
  });
  if (error) {
    return errorResponse("analysis_failed", 500);
  }

  const reservation = uploadIdFromRpc(data);
  if (reservation.errorCode) {
    return errorResponse(reservation.errorCode, statusForError(reservation.errorCode));
  }
  if (!reservation.uploadId) {
    return errorResponse("analysis_failed", 500);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return errorResponse("unauthorized", 401);
  }

  const uploadId = reservation.uploadId;
  after(async () => {
    try {
      await processUpload(
        { uploadId, userId: user.id, accessToken, fileBytes },
        {
          repository: createAnalysisRepositoryForAccessToken(accessToken),
          llm: createClaudeService(),
        },
      );
    } catch {
      // processUpload owns the failure transition. The HTTP response has
      // already been sent and must not expose provider or persistence details.
    }
  });

  return NextResponse.json({ uploadId }, { status: 202 });
}
