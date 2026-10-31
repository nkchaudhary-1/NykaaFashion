/**
 * Named accounts for the access gate (src/proxy.ts) and the session endpoint (src/app/api/session/route.ts).
 *
 * The accounts live in the SITE_USERS environment variable — never in the repository or the browser bundle — as JSON:
 *   [{"id":"Nilesh","password":"…","role":"admin"},{"id":"Kiran","password":"…","role":"user","title":"Director"}]
 * `role` is "admin" or "user"; `name` (display name) defaults to `id`; `title` is shown next to the name.
 *
 * The server checks the password, then issues a signed, HttpOnly session cookie that names the account. The role is looked up from
 * the configuration on every request, so it cannot be changed by editing the cookie. Plain Web Crypto only (no Node APIs), shared by
 * the proxy and the route handler.
 *
 * Sign-ins ISSUED from the admin dashboard (no database): an admin picks a Login ID and how long access lasts; the server answers with a
 * generated password that is a signature over (Login ID, expiry) — `XXXX-XXXX-XXXX-XXXX`, the first group is the expiry. At sign-in the
 * signature is recomputed, so nothing is stored anywhere, it works on every device, and it cannot be extended or moved to another ID. Issued
 * accounts are always regular users. The price of storing nothing: access cannot be switched off before its expiry from the dashboard — put
 * the Login ID in SITE_REVOKED (comma-separated) and redeploy, or change GATE_SECRET to end every issued sign-in at once.
 */
export type Role = "admin" | "user";
export interface Account {
  id: string;
  name: string;
  role: Role;
  title?: string;
  /** issued sign-ins only: the moment access ends (epoch seconds) — the session can never outlive it */
  until?: number;
}
type Secret = Account & { password: string };

export const SESSION_COOKIE = "nf_session";
/** A short-lived, script-readable marker set only after a successful sign-in; the app turns it into one login record, then deletes it. */
export const LOGIN_EVENT_COOKIE = "nf_login_event";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // a week, like the shared-password cookie

const enc = new TextEncoder();

/** null = no accounts configured; "invalid" = SITE_USERS is set but unusable (the gate then fails closed). */
export function accountsConfig(): Secret[] | "invalid" | null {
  const raw = process.env.SITE_USERS;
  if (!raw || !raw.trim()) return null;
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return "invalid";
    const out: Secret[] = [];
    for (const a of list as Array<Record<string, unknown>>) {
      const id = String(a?.id ?? "").trim();
      const password = String(a?.password ?? "");
      const role = a?.role === "admin" ? "admin" : a?.role === "user" ? "user" : null;
      if (!id || !password || !role || out.some((o) => o.id.toLowerCase() === id.toLowerCase())) return "invalid";
      out.push({ id, name: String(a?.name ?? id), role, title: a?.title ? String(a.title) : undefined, password });
    }
    return out;
  } catch {
    return "invalid";
  }
}

const strip = ({ id, name, role, title }: Secret): Account => ({ id, name, role, title });
/** The accounts without their passwords. */
export function listAccounts(): Account[] {
  const all = accountsConfig();
  return Array.isArray(all) ? all.map(strip) : [];
}

const secret = () => process.env.GATE_SECRET || process.env.SITE_USERS || "";

export async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
/** Constant-time comparison of two equal-length hex strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const toB64 = (s: string) => btoa(String.fromCharCode(...enc.encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

/** The account whose Login ID (case-insensitive) and password match, or null. Unknown IDs cost the same as a wrong password. */
export async function verifyLogin(id: string, password: string): Promise<Account | null> {
  const all = accountsConfig();
  if (!Array.isArray(all)) return null;
  const found = all.find((a) => a.id.toLowerCase() === id.trim().toLowerCase());
  const key = secret();
  const ok = safeEqual(await hmac(key, `pw:${password}`), await hmac(key, `pw:${found ? found.password : "\u0000no-such-account"}`));
  if (ok && found) return strip(found);
  return verifyIssued(id, password); // every failure does the same extra work, so a built-in ID is not told apart from an unknown one
}

// ── sign-ins issued from the admin dashboard ───────────────────────────────────────────────────────────────────────
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's alphabet: no I, L, O or U, so nothing is mistaken for 1 or 0
const HOUR = 3_600_000;
const EPOCH_HOURS = Date.UTC(2026, 0, 1) / HOUR; // the expiry is counted in whole hours from here (4 base-32 symbols reach 119 years)
const MAC_SYMBOLS = 12; // 60 bits of signature
export const ISSUED_ID = /^[a-z0-9][a-z0-9._-]{2,23}$/;
export const ISSUED_MAX_HOURS = 24 * 90;

/** Login IDs whose issued sign-ins are switched off: SITE_REVOKED="priya,sam" (takes effect on the next deployment). */
const revokedIds = () => new Set((process.env.SITE_REVOKED ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
const isBuiltIn = (id: string) => {
  const all = accountsConfig();
  return Array.isArray(all) && all.some((a) => a.id.toLowerCase() === id);
};
/** "priya.sharma" → "Priya Sharma" — all the server knows about an issued account's name. */
export const displayName = (id: string) => id.split(/[._-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

function macToB32(hex: string, symbols: number): string {
  let acc = 0;
  let bits = 0;
  let out = "";
  for (let i = 0; i < hex.length && out.length < symbols; i += 2) {
    acc = (acc << 8) | parseInt(hex.slice(i, i + 2), 16);
    bits += 8;
    while (bits >= 5 && out.length < symbols) {
      out += B32[(acc >> (bits - 5)) & 31];
      bits -= 5;
      acc &= (1 << bits) - 1;
    }
  }
  return out;
}
const numToB32 = (n: number, len: number) => {
  let out = "";
  for (let i = 0; i < len; i++) {
    out = B32[n % 32] + out;
    n = Math.floor(n / 32);
  }
  return out;
};
const b32ToNum = (s: string) => {
  let n = 0;
  for (const c of s) {
    const i = B32.indexOf(c);
    if (i < 0) return -1;
    n = n * 32 + i;
  }
  return n;
};
const macFor = async (id: string, expH: number) => macToB32(await hmac(secret(), `issued:${id}:${expH}`), MAC_SYMBOLS);

export interface IssuedSignIn {
  id: string;
  name: string;
  /** shown as XXXX-XXXX-XXXX-XXXX; typing it without the dashes, in any case, works too */
  password: string;
  /** ISO time access ends — always on the hour */
  expiresAt: string;
}
async function signInFor(id: string, expH: number): Promise<IssuedSignIn> {
  const code = numToB32(expH, 4) + (await macFor(id, expH));
  return { id, name: displayName(id), password: code.match(/.{4}/g)!.join("-"), expiresAt: new Date((EPOCH_HOURS + expH) * HOUR).toISOString() };
}

/** Why this Login ID cannot be issued, or null if it can. */
export function issuedIdProblem(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  if (!ISSUED_ID.test(id)) return "Use 3–24 letters, numbers, dots, dashes or underscores, starting with a letter or a number.";
  if (isBuiltIn(id)) return "That Login ID belongs to a built-in account.";
  return null;
}

/** A new sign-in for this Login ID that works for `hours` from now (whole hours, 1 to 90 days). Admin routes only. */
export async function issueSignIn(rawId: string, hours: number): Promise<IssuedSignIn> {
  const id = rawId.trim().toLowerCase();
  const problem = issuedIdProblem(id);
  if (problem) throw new Error(problem);
  const h = Math.min(ISSUED_MAX_HOURS, Math.max(1, Math.round(hours) || 1));
  return signInFor(id, Math.ceil(Date.now() / HOUR) + h - EPOCH_HOURS);
}

/** The password of a sign-in issued earlier, recomputed from its Login ID and expiry — nothing is stored. Admin routes only. */
export async function revealSignIn(rawId: string, expiresAt: string): Promise<IssuedSignIn> {
  const id = rawId.trim().toLowerCase();
  const problem = issuedIdProblem(id);
  if (problem) throw new Error(problem);
  const expH = Math.round(Date.parse(expiresAt) / HOUR) - EPOCH_HOURS;
  if (!Number.isFinite(expH) || expH < 0 || expH > 32 ** 4 - 1) throw new Error("That expiry is not valid.");
  return signInFor(id, expH);
}

/** The regular-user account behind an issued Login ID and password, or null (wrong, expired, revoked, forged, or the ID is a built-in one). */
async function verifyIssued(rawId: string, rawPassword: string): Promise<Account | null> {
  const id = rawId.trim().toLowerCase();
  const code = rawPassword.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const wellFormed = ISSUED_ID.test(id) && /^[0-9A-Z]{16}$/.test(code);
  const expH = wellFormed ? b32ToNum(code.slice(0, 4)) : -1;
  const expected = await macFor(wellFormed ? id : "", Math.max(expH, 0)); // the same work whatever is wrong
  const until = (EPOCH_HOURS + expH) * HOUR;
  if (!wellFormed || expH < 0 || !safeEqual(code.slice(4), expected) || Date.now() >= until || revokedIds().has(id) || isBuiltIn(id)) return null;
  return { id, name: displayName(id), role: "user", title: "Guest", until: Math.floor(until / 1000) };
}

/** How long the session cookie may live: a week, but never past the end of an issued sign-in. */
export function sessionAge(until?: number): number {
  return until === undefined ? SESSION_MAX_AGE : Math.max(0, Math.min(SESSION_MAX_AGE, Math.floor(until - Date.now() / 1000)));
}

/** A signed session for the account. Issued sign-ins get their own token shape (`i.…`) that carries the end of access as its expiry. */
export async function issueSession(accountId: string, until?: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (until === undefined) {
    const exp = now + SESSION_MAX_AGE;
    return `${exp}.${toB64(accountId)}.${await hmac(secret(), `session:${exp}:${accountId}`)}`;
  }
  const exp = Math.min(now + SESSION_MAX_AGE, until);
  return `i.${exp}.${toB64(accountId)}.${await hmac(secret(), `issued-session:${exp}:${accountId}`)}`;
}

/** The signed-in account behind a session cookie value, or null (missing, expired, forged, or the account no longer exists). */
export async function readSession(token: string | undefined): Promise<Account | null> {
  if (!token) return null;
  const parts = token.split(".");
  const issued = parts.length === 4 && parts[0] === "i";
  if (!issued && parts.length !== 3) return null;
  const [exp, idPart, sig] = issued ? parts.slice(1) : parts;
  if (!/^\d{1,12}$/.test(exp) || Number(exp) < Date.now() / 1000) return null;
  let id: string;
  try {
    id = fromB64(idPart);
  } catch {
    return null;
  }
  if (issued) {
    // an issued session is only good while the Login ID is not revoked and is not (or has not become) a built-in one
    if (!safeEqual(sig, await hmac(secret(), `issued-session:${exp}:${id}`)) || revokedIds().has(id) || isBuiltIn(id)) return null;
    return { id, name: displayName(id), role: "user", title: "Guest", until: Number(exp) };
  }
  if (!safeEqual(sig, await hmac(secret(), `session:${exp}:${id}`))) return null;
  const all = accountsConfig();
  const found = Array.isArray(all) ? all.find((a) => a.id === id) : undefined;
  return found ? strip(found) : null;
}

/** 16 random hex characters. */
export function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
}
