// Unsplash API client for the one-off photo curation (search → contact sheets → pick → download). Official API only: unsplash.com itself puts up an anti-bot wall.
//
// The key: UNSPLASH_ACCESS_KEY (an *Access Key* from unsplash.com/oauth/applications — never the Secret key), sent as `Authorization: Client-ID <key>`. If the hosting
// environment injects it for api.unsplash.com as a network secret, nothing is needed here. Demo apps get 50 API requests an hour: every call is counted, search results are
// cached on disk (.cache/unsplash, ignored by git), and when the hour's budget is spent the tools wait for the next hour instead of failing — so every script can simply be run again.
//
// Test-only switches (scripts/qa/unsplash-unit.mjs): UNSPLASH_API (base URL), UNSPLASH_CACHE (cache folder), UNSPLASH_ALLOW_HOST (an extra image host to accept).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { root } from "../placeholders/lib.mjs";

export { root };

export const API = (process.env.UNSPLASH_API ?? "https://api.unsplash.com").replace(/\/+$/, "");
export const CACHE = process.env.UNSPLASH_CACHE ?? join(root, ".cache/unsplash");
export const LIBRARY = join(root, "scripts/placeholders/unsplash"); // the originals we keep (≈ 2000 px wide) and manifest.json
export const CREDITS_JSON = process.env.UNSPLASH_CREDITS ?? join(root, "src/data/generated/photo-credits.json"); // what /credits shows: the photos the build placed, by photographer
export const ASSIGNMENTS_JSON = process.env.UNSPLASH_ASSIGNMENTS ?? join(root, "src/data/generated/photo-assignments.json"); // image key → photo id, for every picture the build cut from Unsplash
export const UTM = "utm_source=nykaa_fashion_prototype&utm_medium=referral"; // Unsplash's attribution links carry these
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const readJson = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
};
export const writeJson = (path, data) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 1) + "\n");
};

/**
 * Some environments (this cloud sandbox among them) reach the internet only through HTTPS_PROXY, and resolve host names there: Node's built-in fetch ignores the proxy unless
 * NODE_USE_ENV_PROXY=1 was set when the process started (Node 22.21+), and otherwise fails with ENOTFOUND. A script that talks to Unsplash calls this first: when a proxy is
 * configured and the switch is missing, it starts itself again with the switch and exits with the same status. Localhost (the tests' stand-in) is in NO_PROXY and stays direct.
 */
export function reexecWithProxy() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!proxy || process.env.NODE_USE_ENV_PROXY || Number(process.versions.node.split(".")[0]) < 22) return;
  const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --disable-warning=UNDICI-EHPA`.trim() },
  });
  process.exit(r.status ?? 1);
}

let calls = 0;
let remaining = Infinity;
export const apiCalls = () => calls;

/** One API call, counted, retried, and patient about the hourly limit. */
export async function api(path, params = {}) {
  const url = new URL(path.startsWith("http") ? path : `${API}${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 6; attempt++) {
    if (remaining <= 0) {
      const wait = 3_600_000 - (Date.now() % 3_600_000) + 20_000; // the budget renews on the hour
      console.log(`  … the hourly request budget is spent; waiting ${Math.round(wait / 60_000)} min for it to renew (progress is saved — Ctrl-C and re-run is fine)`);
      await sleep(process.env.UNSPLASH_API ? 50 : wait);
      remaining = Infinity;
    }
    const res = await fetch(url, { headers: { "accept-version": "v1", ...(process.env.UNSPLASH_ACCESS_KEY ? { authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } : {}) } });
    calls++;
    const left = res.headers.get("x-ratelimit-remaining");
    if (left !== null) remaining = Number(left);
    if (res.status === 401) throw new Error("Unsplash rejected the request (401): UNSPLASH_ACCESS_KEY is missing or wrong. Create an app at unsplash.com/oauth/applications, add its *Access Key* to the environment as UNSPLASH_ACCESS_KEY and start a new session.");
    if (res.status === 403 && /rate limit/i.test(await res.clone().text())) {
      remaining = 0;
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Unsplash answered ${res.status} for ${url.pathname}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  throw new Error(`Unsplash kept failing for ${url.pathname}`);
}

/** The unsized image URL of a photo: from an API / candidate record (urls.raw) or from the manifest (raw). */
export const rawOf = (p) => p.urls?.raw ?? p.raw ?? "";

/** Only free-licence photos on Unsplash's own image host: never Unsplash+ (plus.unsplash.com) and never a third-party URL. */
export function isFree(p) {
  try {
    const host = new URL(rawOf(p)).hostname;
    return (host === "images.unsplash.com" || host === process.env.UNSPLASH_ALLOW_HOST) && !p.premium && !p.plus;
  } catch {
    return false;
  }
}

/** A size of the photo from Unsplash's image CDN (imgix): not an API call, so it does not use the hourly budget. */
export const cdn = (p, params) => {
  const u = new URL(rawOf(p));
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
};
export async function fetchBuffer(url) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status < 500 && res.status !== 429) throw new Error(`image ${res.status}: ${url.slice(0, 90)}`);
    await sleep(1000 * (i + 1));
  }
  throw new Error(`image kept failing: ${url.slice(0, 90)}`);
}
/** Where the build finds a photo's original (a 2400 px JPEG fetched by download.mjs). */
export const originalPath = (id) => join(CACHE, "originals", `${id}.jpg`);
export const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);
export const exists = existsSync;
