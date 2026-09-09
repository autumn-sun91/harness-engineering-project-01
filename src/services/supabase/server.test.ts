import { describe, expect, it, vi } from "vitest";

const getAll = vi.fn(() => []);
const setAll = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll, setAll })),
}));

import { createServerSupabaseClient } from "./server";

describe("server user-context Supabase client", () => {
  it("uses the publishable key and forwards auth cookies", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
    delete process.env.SUPABASE_SECRET_KEY;

    const client = await createServerSupabaseClient();

    expect(client.supabaseUrl).toBe("https://example.supabase.co");
    expect(getAll).toHaveBeenCalled();
    expect(setAll).not.toHaveBeenCalled();
  });
});
