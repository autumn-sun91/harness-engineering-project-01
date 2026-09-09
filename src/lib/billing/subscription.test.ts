import { describe, expect, it } from "vitest";

import { isProSubscription } from "./subscription";
import type { Subscription } from "../../types";

const now = new Date("2026-09-09T00:00:00.000Z");

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    userId: "user-1",
    plan: "pro",
    polarStatus: "active",
    polarCustomerId: "customer-1",
    polarSubscriptionId: "subscription-1",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: "2026-10-09T00:00:00.000Z",
    lastEventId: null,
    lastEventTs: null,
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("isProSubscription", () => {
  it("keeps an active Pro subscription valid until its period ends", () => {
    expect(isProSubscription(subscription(), now)).toBe(true);
  });

  it("keeps a cancellation scheduled subscription valid before its period ends", () => {
    expect(isProSubscription(subscription({
      polarStatus: "canceled",
      cancelAtPeriodEnd: true,
    }), now)).toBe(true);
  });

  it("does not grant Pro after the period ends or for a revoked subscription", () => {
    expect(isProSubscription(subscription({
      currentPeriodEnd: "2026-09-08T23:59:59.000Z",
    }), now)).toBe(false);
    expect(isProSubscription(subscription({
      polarStatus: "revoked",
      cancelAtPeriodEnd: false,
    }), now)).toBe(false);
  });
});
