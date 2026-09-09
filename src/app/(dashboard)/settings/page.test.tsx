import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("../../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../../app/login/actions", () => ({
  signOut: vi.fn(),
}));

import SettingsPage from "./page";

function serverClient(subscription: Record<string, unknown> | null) {
  const maybeSingle = vi.fn(async () => ({ data: subscription, error: null }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
    from: vi.fn(() => ({ select })),
  };
}

describe("/settings", () => {
  it("shows the Free plan and upgrade CTA", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(serverClient({ plan: "free" }));

    const markup = renderToStaticMarkup(await SettingsPage());

    expect(markup).toContain("Free");
    expect(markup).toContain("업그레이드");
    expect(markup).toContain("로그아웃");
    expect(markup).toContain("/api/account/delete");
  });

  it("shows the Pro portal and scheduled end date", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(serverClient({
      plan: "pro",
      polar_status: "active",
      cancel_at_period_end: true,
      current_period_end: "2026-10-09T00:00:00.000Z",
    }));

    const markup = renderToStaticMarkup(await SettingsPage());

    expect(markup).toContain("Pro");
    expect(markup).toContain("종료 예정");
    expect(markup).toContain("2026. 10. 9.");
    expect(markup).toContain('href="/api/polar/portal"');
    expect(markup).not.toContain("/api/polar/checkout");
  });
});
