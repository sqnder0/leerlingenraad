import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  // Points are admin-only data (docs/plan.md §3), with two narrow, deliberate
  // exceptions: lib/rotation.ts uses aggregate balances for the duty-picker
  // algorithm (never displays anyone's individual balance), and the member
  // dashboard shows the viewer's own balance + the school-year average via
  // getFairnessSummary (never another member's balance). Everywhere else,
  // lib/data/points may only be imported from admin pages/layouts and admin
  // server actions.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/app/(protected)/admin/**",
      "src/actions/admin/**",
      "src/lib/rotation.ts",
      "src/app/(protected)/dashboard/page.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*/lib/data/points", "@/lib/data/points"],
              message:
                "lib/data/points is admin-only (plan §3) — import it only from app/(protected)/admin/**, actions/admin/**, lib/rotation.ts, or the member dashboard's getFairnessSummary usage.",
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
