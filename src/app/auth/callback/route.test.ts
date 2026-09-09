import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../../services/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { GET } from "./route";

describe("auth callback route", () => {
  it("returns cancelled OAuth errors to login without accepting an external next path", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?error=access_denied&next=https%3A%2F%2Fevil.com",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=oauth_cancelled&next=%2Fdashboard",
    );
  });

  it("returns a missing code to login as an OAuth failure", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=oauth_failed&next=%2Fdashboard",
    );
  });
});
