/**
 * Which release channel this build belongs to — see docs/RELEASE.md.
 *
 *  • "staging"    — the review site. Everything new is built and shown here first. It carries a yellow bar saying so, and its home page opens on the experimental layout.
 *  • "production" — the live prototype. Local runs and every build that scripts/release/deploy.sh did not mark as staging are "production", so the QA suite
 *                   exercises exactly what ships.
 *
 * The values are NEXT_PUBLIC_* so they are inlined at build time and the server render and the browser always agree (no hydration mismatch).
 * scripts/release/deploy.sh sets them with `vercel deploy --build-env`.
 */
export const CHANNEL: "staging" | "production" = process.env.NEXT_PUBLIC_RELEASE_CHANNEL === "staging" ? "staging" : "production";
export const IS_STAGING = CHANNEL === "staging";
/** Short commit id of the build (staging deploys only; empty otherwise). */
export const BUILD_SHA = (process.env.NEXT_PUBLIC_BUILD_SHA ?? "").slice(0, 7);
/** Where the live prototype is, so the staging bar can link to it. */
export const LIVE_URL = process.env.NEXT_PUBLIC_LIVE_URL ?? "";
