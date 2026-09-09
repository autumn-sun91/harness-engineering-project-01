import { NextRequest, NextResponse } from "next/server";

import { isProSubscription } from "../../../../lib/billing/subscription";
import { verifyPolarWebhook } from "../../../../services/polar";
import { createServiceRoleSupabaseClient } from "../../../../services/supabase/admin";

export const runtime = "nodejs";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function subscriptionEvent(value: unknown): { type: string; timestamp: Date; data: RecordValue } | null {
  if (!isRecord(value) || typeof value.type !== "string" || !value.type.startsWith("subscription.") || !isRecord(value.data)) {
    return null;
  }

  const timestamp = value.timestamp instanceof Date ? value.timestamp : new Date(String(value.timestamp));
  if (!Number.isFinite(timestamp.getTime())) {
    return null;
  }
  return { type: value.type, timestamp, data: value.data };
}

function errorResponse(code: "unauthorized" | "analysis_failed", status: number, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  let verified: unknown;
  try {
    verified = await verifyPolarWebhook(body, request.headers);
  } catch {
    return errorResponse("unauthorized", 401, "웹훅 서명을 확인할 수 없습니다.");
  }

  const event = subscriptionEvent(verified);
  if (!event) {
    return NextResponse.json({ received: true });
  }

  const userId = isRecord(event.data.metadata) ? stringValue(event.data.metadata.user_id) : null;
  const subscriptionId = stringValue(event.data.id);
  const customerId = stringValue(event.data.customerId);
  const status = stringValue(event.data.status);
  const currentPeriodEnd = event.data.currentPeriodEnd instanceof Date
    ? event.data.currentPeriodEnd.toISOString()
    : isoDate(event.data.currentPeriodEnd);
  const cancelAtPeriodEnd = event.data.cancelAtPeriodEnd === true;
  if (!userId || !subscriptionId || !customerId || !status || !currentPeriodEnd) {
    return NextResponse.json({ received: true });
  }

  const eventId = request.headers.get("webhook-id")
    ?? request.headers.get("x-polar-event-id")
    ?? `${event.type}:${subscriptionId}:${event.timestamp.toISOString()}`;
  const supabase = createServiceRoleSupabaseClient();
  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("user_id,last_event_id,last_event_ts")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) {
    return errorResponse("analysis_failed", 500, "구독 상태를 읽지 못했습니다.");
  }
  if (!existing) {
    return NextResponse.json({ received: true });
  }

  const existingEventId = stringValue(existing.last_event_id);
  const existingEventTimestamp = existing.last_event_ts instanceof Date
    ? existing.last_event_ts.getTime()
    : typeof existing.last_event_ts === "string" ? Date.parse(existing.last_event_ts) : NaN;
  if (existingEventId === eventId || (Number.isFinite(existingEventTimestamp) && event.timestamp.getTime() <= existingEventTimestamp)) {
    return NextResponse.json({ received: true });
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan: isProSubscription({
        plan: "pro",
        polarStatus: status,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      }) ? "pro" : "free",
      polar_status: status,
      polar_customer_id: customerId,
      polar_subscription_id: subscriptionId,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: currentPeriodEnd,
      last_event_id: eventId,
      last_event_ts: event.timestamp.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updateError) {
    return errorResponse("analysis_failed", 500, "구독 상태를 저장하지 못했습니다.");
  }

  return NextResponse.json({ received: true });
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
