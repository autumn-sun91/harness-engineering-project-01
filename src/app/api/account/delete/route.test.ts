import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleSupabaseClient: vi.fn(),
  cancelPolarSubscription: vi.fn(),
  deleteAccountData: vi.fn(),
}));

vi.mock("../../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../../services/supabase/admin", () => ({
  createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("../../../../services/polar", () => ({
  cancelPolarSubscription: mocks.cancelPolarSubscription,
}));
vi.mock("../../../../lib/account/delete-account", () => ({
  deleteAccountData: mocks.deleteAccountData,
}));

import { POST } from "./route";

const userId = "00000000-0000-0000-0000-000000000001";

function request(confirmation = "계정 삭제"): NextRequest {
  return new NextRequest("http://localhost:3000/api/account/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirmation }),
  });
}

function setup({ user = { id: userId }, subscription = null as Record<string, unknown> | null } = {}) {
  const order: string[] = [];
  const getUser = vi.fn(async () => ({ data: { user } }));
  const signOut = vi.fn(async () => {
    order.push("signout");
    return { error: null };
  });
  const maybeSingle = vi.fn(async () => ({ data: subscription, error: null }));
  const subscriptionEq = vi.fn((column: string, value: string) => {
    order.push(`scope:${column}:${value}`);
    return { maybeSingle };
  });
  const select = vi.fn(() => ({ eq: subscriptionEq }));
  const from = vi.fn(() => ({ select }));
  const admin = { from };

  mocks.createServerSupabaseClient.mockResolvedValue({ auth: { getUser, signOut } });
  mocks.createServiceRoleSupabaseClient.mockReturnValue(admin);
  mocks.cancelPolarSubscription.mockImplementation(async () => {
    order.push("cancel");
  });
  mocks.deleteAccountData.mockImplementation(async () => {
    order.push("delete");
  });

  return { order, admin, signOut, subscriptionEq };
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests without touching service-role data", async () => {
    setup({ user: null });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.deleteAccountData).not.toHaveBeenCalled();
  });

  it("requires the exact confirmation text", async () => {
    setup();

    const response = await POST(request("삭제"));

    expect(response.status).toBe(400);
    expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
    expect(mocks.deleteAccountData).not.toHaveBeenCalled();
  });

  it("cancels the owned subscription before deleting user data and ending the session", async () => {
    const database = setup({
      subscription: {
        user_id: userId,
        polar_subscription_id: "polar-subscription-1",
        polar_status: "active",
      },
    });

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(database.subscriptionEq).toHaveBeenCalledWith("user_id", userId);
    expect(mocks.cancelPolarSubscription).toHaveBeenCalledWith("polar-subscription-1");
    expect(mocks.deleteAccountData).toHaveBeenCalledWith(database.admin, userId);
    expect(database.order).toEqual([`scope:user_id:${userId}`, "cancel", "delete", "signout"]);
  });

  it("deletes a Free account without attempting a missing Polar cancellation", async () => {
    setup({ subscription: { user_id: userId, polar_subscription_id: null, polar_status: null } });

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(mocks.cancelPolarSubscription).not.toHaveBeenCalled();
    expect(mocks.deleteAccountData).toHaveBeenCalledWith(expect.any(Object), userId);
  });
});
