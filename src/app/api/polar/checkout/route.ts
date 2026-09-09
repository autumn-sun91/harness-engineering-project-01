import { NextResponse } from "next/server";

import { billingSuccessUrl, createPolarCheckout } from "../../../../services/polar";
import { createServerSupabaseClient } from "../../../../services/supabase/server";

export const runtime = "nodejs";

function errorResponse(code: "unauthorized" | "analysis_failed", status: number, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return errorResponse("unauthorized", 401, "로그인이 필요합니다.");
  }

  try {
    const checkout = await createPolarCheckout(data.user.id, billingSuccessUrl());
    return NextResponse.redirect(checkout.url, 303);
  } catch {
    return errorResponse("analysis_failed", 502, "결제 페이지를 열지 못했습니다.");
  }
}
