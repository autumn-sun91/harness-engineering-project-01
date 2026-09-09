import type { Subscription } from "../../types";

const ACTIVE_POLAR_STATUSES = new Set(["active", "trialing"]);
const SCHEDULED_CANCELLATION_STATUSES = new Set(["canceled", "cancelled"]);

/**
 * The only application-side source of truth for whether a subscription is
 * currently entitled to Pro data.
 */
export function isProSubscription(
  subscription: Pick<Subscription, "plan" | "polarStatus" | "cancelAtPeriodEnd" | "currentPeriodEnd">,
  now: Date = new Date(),
): boolean {
  if (subscription.plan !== "pro" || !subscription.currentPeriodEnd) {
    return false;
  }

  const periodEnd = Date.parse(subscription.currentPeriodEnd);
  if (!Number.isFinite(periodEnd) || periodEnd < now.getTime()) {
    return false;
  }

  if (ACTIVE_POLAR_STATUSES.has(subscription.polarStatus ?? "")) {
    return true;
  }

  return subscription.cancelAtPeriodEnd
    && SCHEDULED_CANCELLATION_STATUSES.has(subscription.polarStatus ?? "");
}
