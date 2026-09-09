import { NextRequest, NextResponse } from "next/server";

import { deleteAccountData } from "../../../../lib/account/delete-account";
import { cancelPolarSubscription } from "../../../../services/polar";
import { createServiceRoleSupabaseClient } from "../../../../services/supabase/admin";
import { createServerSupabaseClient } from "../../../../services/supabase/server";

export const runtime = "nodejs";

const CONFIRMATION_TEXT = "계정 삭제";
const TERMINAL_POLAR_STATUSES = new Set([
  "canceled",
  "cancelled",
  "revoked",
  "expired",
  "incomplete_expired",
]);

type SubscriptionRow = {
  user_id?: unknown;
  polar_subscription_id?: unknown;
  polar_status?: unknown;
};

function errorResponse(code: "unauthorized" | "analysis_failed", status: number, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function confirmationFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body: unknown = await request.json();
      if (typeof body === "object" && body !== null && "confirmation" in body) {
        const value = body.confirmation;
        return typeof value === "string" ? value : null;
      }
      return null;
    }

    const formData = await request.formData();
    const value = formData.get("confirmation");
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function shouldCancelSubscription(row: SubscriptionRow | null, userId: string): string | null {
  if (!row || row.user_id !== userId) {
    return null;
  }

  const subscriptionId = stringValue(row.polar_subscription_id);
  const status = stringValue(row.polar_status);
  if (!subscriptionId || (status && TERMINAL_POLAR_STATUSES.has(status))) {
    return null;
  }
  return subscriptionId;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionSupabase = await createServerSupabaseClient();
  const { data: userData } = await sessionSupabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return errorResponse("unauthorized", 401, "로그인이 필요합니다.");
  }

  const confirmation = await confirmationFromRequest(request);
  if (confirmation !== CONFIRMATION_TEXT) {
    return errorResponse("analysis_failed", 400, "확인 문구가 올바르지 않습니다.");
  }

  try {
    const adminSupabase = createServiceRoleSupabaseClient();
    const { data, error: subscriptionReadError } = await adminSupabase
      .from("subscriptions")
      .select("user_id,polar_subscription_id,polar_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subscriptionReadError) {
      throw new Error("subscription lookup failed");
    }

    const subscription = typeof data === "object" && data !== null
      ? data as SubscriptionRow
      : null;
    const subscriptionId = shouldCancelSubscription(subscription, user.id);
    if (subscriptionId) {
      await cancelPolarSubscription(subscriptionId);
    }

    await deleteAccountData(adminSupabase, user.id);

    const { error: signOutError } = await sessionSupabase.auth.signOut();
    if (signOutError) {
      throw new Error("session termination failed");
    }

    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch {
    return errorResponse("analysis_failed", 500, "계정을 삭제하지 못했습니다. 다시 시도해주세요.");
  }
}
