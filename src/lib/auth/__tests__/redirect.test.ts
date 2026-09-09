import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "../redirect";

describe("getSafeRedirectPath", () => {
  it("allows an internal dashboard path", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  it("rejects an absolute external URL", () => {
    expect(getSafeRedirectPath("https://evil.com")).toBe("/dashboard");
  });

  it("rejects a protocol-relative URL", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("rejects browser-normalized backslash redirects", () => {
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });

  it("uses the supplied fallback for missing or invalid paths", () => {
    expect(getSafeRedirectPath(null, "/login")).toBe("/login");
    expect(getSafeRedirectPath("settings", "/login")).toBe("/login");
  });
});
