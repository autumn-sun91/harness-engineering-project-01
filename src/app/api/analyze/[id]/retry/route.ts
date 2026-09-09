import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { retryUploadAnalysis } from "../../../../../lib/analysis/process-upload";
import { createServerSupabaseClient } from "../../../../../services/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "로그인이 필요합니다.",
  retry_limit_exceeded: "재시도 횟수를 모두 썼습니다.",
  not_found: "리포트를 찾을 수 없습니다.",
  analysis_in_progress: "이미 분석 중인 파일이 있습니다. 완료된 뒤 다시 시도해주세요.",
  analysis_failed: "분석에 실패했습니다.",
};

type SupabaseRetryClient = {
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
    { error: { code, message: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.analysis_failed } },
    { status },
  );
}

function rpcRow(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return typeof row === "object" && row !== null ? row as Record<string, unknown> : null;
}

function statusForError(code: string): number {
  if (code === "unauthorized") return 401;
  if (code === "not_found") return 404;
  if (code === "retry_limit_exceeded" || code === "analysis_in_progress") return 409;
  return 400;
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient() as unknown as SupabaseRetryClient;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return errorResponse("unauthorized", 401);
  }

  const { data, error } = await supabase.rpc("claim_analysis_retry", { upload_id: id });
  if (error) {
    return errorResponse("analysis_failed", 500);
  }

  const row = rpcRow(data);
  const errorCode = typeof row?.error_code === "string"
    ? row.error_code
    : typeof row?.errorCode === "string" ? row.errorCode : null;
  const uploadId = typeof row?.upload_id === "string"
    ? row.upload_id
    : typeof row?.uploadId === "string" ? row.uploadId : null;
  if (errorCode) {
    return errorResponse(errorCode, statusForError(errorCode));
  }
  if (!uploadId) {
    return errorResponse("not_found", 404);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return errorResponse("unauthorized", 401);
  }

  after(async () => {
    try {
      await retryUploadAnalysis({ uploadId, userId: user.id, accessToken });
    } catch {
      // The retry processor owns persistence of its terminal state. Do not
      // expose provider or database details from an after() task.
    }
  });

  return NextResponse.json({ uploadId }, { status: 202 });
}
