import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyPolarWebhook: vi.fn(),
  createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("../../../../services/polar", () => ({
  verifyPolarWebhook: mocks.verifyPolarWebhook,
}));
vi.mock("../../../../services/supabase/admin", () => ({
  createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));

import { POST } from "./route";

const userId = "00000000-0000-0000-0000-000000000001";

function event(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: "subscription.active",
    timestamp: "2026-09-09T00:00:00.000Z",
    data: {
      id: "polar-subscription-1",
      status: "active",
      customerId: "polar-customer-1",
      currentPeriodEnd: "2026-10-09T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      metadata: { user_id: userId },
    },
    ...overrides,
  };
}

function request(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/polar/webhook", {
    method: "POST",
    headers,
    body: "{}",
  });
}

function supabaseFor(row: Record<string, unknown> | null) {
  const update = vi.fn(() => ({
    eq: vi.fn(async () => ({ error: null })),
  }));
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle })),
  }));
  return {
    client: { from: vi.fn(() => ({ select, update })) },
    update,
  };
}

describe("POST /api/polar/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POLAR_WEBHOOK_SECRET = "test-webhook-secret";
  });

  it("returns 401 and does not touch subscriptions when verification fails", async () => {
    const database = supabaseFor({ user_id: userId, last_event_id: null, last_event_ts: null });
    mocks.createServiceRoleSupabaseClient.mockReturnValue(database.client);
    mocks.verifyPolarWebhook.mockRejectedValue(new Error("invalid signature"));

    const response = await POST(request({ "webhook-id": "event-1" }));

    expect(response.status).toBe(401);
    expect(database.client.from).not.toHaveBeenCalled();
  });

  it("ignores an identical event without a second update", async () => {
    const database = supabaseFor({ user_id: userId, last_event_id: "event-1", last_event_ts: "2026-09-09T00:00:00.000Z" });
    mocks.createServiceRoleSupabaseClient.mockReturnValue(database.client);
    mocks.verifyPolarWebhook.mockResolvedValue(event());

    const response = await POST(request({ "webhook-id": "event-1" }));

    expect(response.status).toBe(200);
    expect(database.update).not.toHaveBeenCalled();
  });

  it("does not let an older event overwrite the current subscription", async () => {
    const database = supabaseFor({ user_id: userId, last_event_id: "event-2", last_event_ts: "2026-09-10T00:00:00.000Z" });
    mocks.createServiceRoleSupabaseClient.mockReturnValue(database.client);
    mocks.verifyPolarWebhook.mockResolvedValue(event({ timestamp: "2026-09-09T00:00:00.000Z" }));

    const response = await POST(request({ "webhook-id": "event-1" }));

    expect(response.status).toBe(200);
    expect(database.update).not.toHaveBeenCalled();
  });

  it("updates the owned subscription after verification", async () => {
    const database = supabaseFor({ user_id: userId, last_event_id: null, last_event_ts: null });
    mocks.createServiceRoleSupabaseClient.mockReturnValue(database.client);
    mocks.verifyPolarWebhook.mockResolvedValue(event());

    const response = await POST(request({ "webhook-id": "event-1" }));

    expect(response.status).toBe(200);
    expect(database.update).toHaveBeenCalledWith(expect.objectContaining({
      plan: "pro",
      polar_status: "active",
      polar_subscription_id: "polar-subscription-1",
      last_event_id: "event-1",
    }));
  });
});
