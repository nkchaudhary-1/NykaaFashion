import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Extra build folders: parallel dev servers and test builds use NEXT_DIST_DIR=.next-<name> (see next.config.ts).
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node tooling (image tooling, QA runners, data scripts) — plain scripts, not app code.
    "scripts/**",
  ]),
]);

export default eslintConfig;
