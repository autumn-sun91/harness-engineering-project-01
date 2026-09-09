import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser: mocks.getUser } })),
}));

import { middleware } from "./middleware";

describe("auth middleware", () => {
  it("redirects unauthenticated dashboard requests to login with a return path", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await middleware(
      new NextRequest("http://localhost:3000/dashboard?tab=history"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard%3Ftab%3Dhistory",
    );
  });

  it("protects settings with the same authenticated route boundary", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await middleware(
      new NextRequest("http://localhost:3000/settings"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fsettings",
    );
  });
});
