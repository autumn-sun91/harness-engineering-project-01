import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPolarCheckout: vi.fn(),
  getPolarSubscription: vi.fn(),
}));

vi.mock("../../services/polar", () => ({
  getPolarCheckout: mocks.getPolarCheckout,
  getPolarSubscription: mocks.getPolarSubscription,
}));

import { syncSubscriptionFromCheckout } from "./checkout-sync";

describe("syncSubscriptionFromCheckout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires both checkout ownership markers before writing through the RPC", async () => {
    mocks.getPolarCheckout.mockResolvedValue({
      status: "succeeded",
      externalCustomerId: "user-2",
      metadata: { user_id: "user-2" },
      subscriptionId: "subscription-1",
    });
    const supabase = { rpc: vi.fn() };

    await syncSubscriptionFromCheckout({ checkoutId: "checkout-1", userId: "user-1", supabase });

    expect(mocks.getPolarSubscription).not.toHaveBeenCalled();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("syncs the one successful return through the authenticated RPC", async () => {
    mocks.getPolarCheckout.mockResolvedValue({
      status: "succeeded",
      externalCustomerId: "user-1",
      customerId: "customer-1",
      metadata: { user_id: "user-1" },
      subscriptionId: "subscription-1",
      modifiedAt: "2026-09-09T00:00:00.000Z",
    });
    mocks.getPolarSubscription.mockResolvedValue({
      id: "subscription-1",
      status: "active",
      customerId: "customer-1",
      currentPeriodEnd: "2026-10-09T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    });
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };

    await syncSubscriptionFromCheckout({ checkoutId: "checkout-1", userId: "user-1", supabase });

    expect(supabase.rpc).toHaveBeenCalledWith("sync_polar_subscription", expect.objectContaining({
      p_plan: "pro",
      p_polar_subscription_id: "subscription-1",
      p_current_period_end: "2026-10-09T00:00:00.000Z",
    }));
  });
});
