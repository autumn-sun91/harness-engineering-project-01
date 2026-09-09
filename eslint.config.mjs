import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import { globalIgnores } from "eslint/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url))
});

const eslintConfig = [
  {
    plugins: {
      "@next/next": nextPlugin
    },
    rules: nextPlugin.configs.recommended.rules
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".claude/**",
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "*.config.*"
  ])
];

export default eslintConfig;
