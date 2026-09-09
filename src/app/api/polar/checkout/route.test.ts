import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  createPolarCheckout: vi.fn(),
}));

vi.mock("../../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../../services/polar", () => ({
  createPolarCheckout: mocks.createPolarCheckout,
  billingSuccessUrl: vi.fn(() => "http://localhost:3000/dashboard?checkout=success"),
}));

import { POST } from "./route";

describe("POST /api/polar/checkout", () => {
  it("requires the authenticated server session", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.createPolarCheckout).not.toHaveBeenCalled();
  });

  it("creates a server-configured checkout and redirects to Polar", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    });
    mocks.createPolarCheckout.mockResolvedValue({ url: "https://sandbox.polar.sh/checkout/session-1" });

    const response = await POST();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://sandbox.polar.sh/checkout/session-1");
    expect(mocks.createPolarCheckout).toHaveBeenCalledWith(
      "user-1",
      expect.stringContaining("/dashboard?checkout=success"),
    );
  });
});
