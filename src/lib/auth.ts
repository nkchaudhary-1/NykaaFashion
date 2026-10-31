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
 */
export type Role = "admin" | "user";
export interface Account {
  id: string;
  name: string;
  role: Role;
  title?: string;
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
  return ok && found ? strip(found) : null;
}

export async function issueSession(accountId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${exp}.${toB64(accountId)}.${await hmac(secret(), `session:${exp}:${accountId}`)}`;
}

/** The signed-in account behind a session cookie value, or null (missing, expired, forged, or the account no longer exists). */
export async function readSession(token: string | undefined): Promise<Account | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [exp, idPart, sig] = parts;
  if (!/^\d{1,12}$/.test(exp) || Number(exp) < Date.now() / 1000) return null;
  let id: string;
  try {
    id = fromB64(idPart);
  } catch {
    return null;
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
