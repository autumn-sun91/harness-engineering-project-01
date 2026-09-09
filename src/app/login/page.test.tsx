import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import LoginPage from "./page";

describe("/login", () => {
  it("discloses Anthropic processing and links to the privacy policy", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });

    const markup = renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(markup).toContain("거래 데이터가 분석을 위해 Anthropic API로 전송됩니다");
    expect(markup).toContain('href="/privacy"');
  });
});
