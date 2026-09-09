import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["eval/**/*.test.{ts,tsx}", "scripts/eval/**/*.test.{ts,tsx}"]
  }
});
