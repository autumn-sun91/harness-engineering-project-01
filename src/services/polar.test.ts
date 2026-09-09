import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  get: vi.fn(),
  subscriptionGet: vi.fn(),
  customerSessionCreate: vi.fn(),
  validateEvent: vi.fn(),
}));

vi.mock("@polar-sh/sdk", () => ({
  Polar: class {
    checkouts = { create: mocks.create, get: mocks.get };
    subscriptions = { get: mocks.subscriptionGet };
    customerSessions = { create: mocks.customerSessionCreate };
  },
}));
vi.mock("@polar-sh/sdk/webhooks", () => ({
  validateEvent: mocks.validateEvent,
}));

import {
  createCustomerPortalSession,
  createPolarCheckout,
  verifyPolarWebhook,
} from "./polar";

describe("Polar service wrapper", () => {
  it("uses only the server product and user metadata for checkout", async () => {
    process.env.POLAR_ACCESS_TOKEN = "server-token";
    process.env.POLAR_PRODUCT_ID = "server-product";
    process.env.POLAR_SERVER = "sandbox";
    mocks.create.mockResolvedValue({ url: "https://polar.example/checkout" });

    await createPolarCheckout("user-1", "http://localhost:3000/dashboard?checkout=success");

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      products: ["server-product"],
      externalCustomerId: "user-1",
      metadata: { user_id: "user-1" },
    }));
  });

  it("delegates webhook verification to the official Polar verifier", async () => {
    process.env.POLAR_WEBHOOK_SECRET = "webhook-secret";
    const payload = { type: "subscription.active" };
    mocks.validateEvent.mockReturnValue(payload);

    const headers = new Headers({ "webhook-id": "event-1" });
    await expect(verifyPolarWebhook("{}", headers)).resolves.toBe(payload);
    expect(mocks.validateEvent).toHaveBeenCalledWith(
      "{}",
      { "webhook-id": "event-1" },
      "webhook-secret",
    );
  });

  it("creates a customer session for the authenticated external customer", async () => {
    process.env.POLAR_ACCESS_TOKEN = "server-token";
    process.env.POLAR_SERVER = "sandbox";
    mocks.customerSessionCreate.mockResolvedValue({ customerPortalUrl: "https://polar.example/portal" });

    await createCustomerPortalSession("user-1", "http://localhost:3000/dashboard");

    expect(mocks.customerSessionCreate).toHaveBeenCalledWith({
      externalCustomerId: "user-1",
      returnUrl: "http://localhost:3000/dashboard",
    });
  });
});
