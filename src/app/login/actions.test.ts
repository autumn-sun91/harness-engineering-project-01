import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  redirect: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../services/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { signInWithGoogle, signOut } from "./actions";

describe("login actions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation((target: string) => {
      throw new Error(`redirect:${target}`);
    });
    mocks.signInWithOAuth.mockReset();
    mocks.signOut.mockReset();
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithOAuth: mocks.signInWithOAuth,
        signOut: mocks.signOut,
      },
    });
  });

  it("starts Google OAuth with a validated callback path", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });

    const formData = new FormData();
    formData.set("next", "https://evil.com");

    await expect(signInWithGoogle(formData)).rejects.toThrow(
      "redirect:https://accounts.google.com/oauth",
    );
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard",
      },
    });
  });

  it("signs out and returns to the landing page", async () => {
    await expect(signOut()).rejects.toThrow("redirect:/");
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
