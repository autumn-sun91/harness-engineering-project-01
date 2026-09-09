import { NextRequest, NextResponse } from "next/server";

import { getSafeRedirectPath } from "../../../lib/auth/redirect";
import { createServerSupabaseClient } from "../../../services/supabase/server";

function getLoginRedirect(
  request: NextRequest,
  error: "oauth_cancelled" | "oauth_failed",
  nextPath: string,
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
  const oauthError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");

  if (oauthError) {
    return getLoginRedirect(
      request,
      oauthError === "access_denied" ? "oauth_cancelled" : "oauth_failed",
      nextPath,
    );
  }

  if (!code) {
    return getLoginRedirect(request, "oauth_failed", nextPath);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return getLoginRedirect(request, "oauth_failed", nextPath);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
