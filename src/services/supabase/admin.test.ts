import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createServiceRoleSupabaseClient } from "./admin";

describe("service-role Supabase client", () => {
  it("uses server-only Supabase credentials without persisting a session", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "service-role-test-key";

    const client = createServiceRoleSupabaseClient();

    expect(client.supabaseUrl).toBe("https://example.supabase.co");
    expect(client.auth).toBeDefined();
  });
});
