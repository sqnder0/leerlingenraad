import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  // Points are admin-only data (docs/plan.md §3): lib/data/points may only
  // be imported from admin pages/layouts and admin server actions.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/(protected)/admin/**", "src/actions/admin/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*/lib/data/points", "@/lib/data/points"],
              message:
                "lib/data/points is admin-only (plan §3) — import it only from app/(protected)/admin/** or actions/admin/**.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
