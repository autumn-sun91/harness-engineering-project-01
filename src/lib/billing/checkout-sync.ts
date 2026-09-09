import {
  getPolarCheckout,
  getPolarSubscription,
} from "../../services/polar";
import { isProSubscription } from "./subscription";

interface BillingRpcClient {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => unknown;
}

interface PolarCheckoutForSync {
  status: string;
  subscriptionId: string | null;
  customerId: string | null;
  externalCustomerId: string | null;
  metadata: Record<string, unknown>;
  modifiedAt: Date | string | null;
}

interface PolarSubscriptionForSync {
  id: string;
  status: string;
  customerId: string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd: boolean;
}

function isoDate(value: Date | string): string | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function syncSubscriptionFromCheckout({
  checkoutId,
  userId,
  supabase,
}: {
  checkoutId: string;
  userId: string;
  supabase: BillingRpcClient;
}): Promise<void> {
  const checkout = await getPolarCheckout(checkoutId) as PolarCheckoutForSync;
  if (checkout.status !== "succeeded" && checkout.status !== "confirmed") {
    return;
  }
  if (checkout.externalCustomerId !== userId || checkout.metadata.user_id !== userId || !checkout.subscriptionId) {
    return;
  }

  const subscription = await getPolarSubscription(checkout.subscriptionId) as PolarSubscriptionForSync;
  if (checkout.customerId && checkout.customerId !== subscription.customerId) {
    return;
  }

  const currentPeriodEnd = isoDate(subscription.currentPeriodEnd);
  if (!currentPeriodEnd) {
    return;
  }

  const checkoutTimestamp = checkout.modifiedAt ? isoDate(checkout.modifiedAt) : new Date().toISOString();
  if (!checkoutTimestamp) {
    return;
  }

  const result = await supabase.rpc("sync_polar_subscription", {
    p_plan: isProSubscription({
      plan: "pro",
      polarStatus: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd,
    }) ? "pro" : "free",
    p_polar_status: subscription.status,
    p_polar_customer_id: subscription.customerId,
    p_polar_subscription_id: subscription.id,
    p_cancel_at_period_end: subscription.cancelAtPeriodEnd,
    p_current_period_end: currentPeriodEnd,
    p_last_event_id: `checkout:${checkoutId}`,
    p_last_event_ts: checkoutTimestamp,
  }) as { error?: unknown };
  if (result.error) {
    throw new Error("subscription sync failed");
  }
}

export function billingPortalReturnUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${value.replace(/\/$/, "")}/dashboard`;
}
