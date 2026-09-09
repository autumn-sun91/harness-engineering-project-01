"use server";

import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "../../lib/auth/redirect";
import { createServerSupabaseClient } from "../../services/supabase/server";

function getRequestedPath(formData: FormData): string {
  const nextValue = formData.get("next");
  return getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null);
}

function getLoginErrorPath(error: "oauth_failed", nextPath: string): string {
  const loginUrl = new URL("/login", "https://txanalyzer.invalid");
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", nextPath);
  return `${loginUrl.pathname}${loginUrl.search}`;
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const nextPath = getRequestedPath(formData);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    redirect(getLoginErrorPath("oauth_failed", nextPath));
  }

  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect(getLoginErrorPath("oauth_failed", nextPath));
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
