import { describe, expect, it } from "vitest";

import { createBrowserSupabaseClient } from "./browser";

describe("browser Supabase client", () => {
  it("uses only the public Supabase URL and publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    delete process.env.SUPABASE_SECRET_KEY;

    const client = createBrowserSupabaseClient();

    expect(client.supabaseUrl).toBe("https://example.supabase.co");
    expect(client.realtime).toBeDefined();
  });
});
