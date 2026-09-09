import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  createCustomerPortalSession: vi.fn(),
}));

vi.mock("../../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../../services/polar", () => ({
  createCustomerPortalSession: mocks.createCustomerPortalSession,
  billingReturnUrl: vi.fn(() => "http://localhost:3000/dashboard"),
}));

import { GET } from "./route";

describe("GET /api/polar/portal", () => {
  it("requires the authenticated server session", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("redirects the authenticated user to the Polar customer portal", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    });
    mocks.createCustomerPortalSession.mockResolvedValue({
      customerPortalUrl: "https://sandbox.polar.sh/portal/session-1",
    });

    const response = await GET();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://sandbox.polar.sh/portal/session-1");
    expect(mocks.createCustomerPortalSession).toHaveBeenCalledWith(
      "user-1",
      expect.stringContaining("/dashboard"),
    );
  });
});
