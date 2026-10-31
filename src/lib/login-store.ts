/*
 * Sign-ins recorded on the SERVER, so the admin dashboard sees every successful sign-in from every browser and device — not just the ones made in the browser
 * the dashboard is open in. The proxy writes one event per successful authentication (src/proxy.ts); /api/admin/logins reads them back for the admin.
 *
 * Where it lives:
 *  • Redis over HTTP (Upstash, added from the Vercel Marketplace: it provides KV_REST_API_URL and KV_REST_API_TOKEN) — what the hosted site uses;
 *  • LOGIN_STORE=file:/path/to/logins.json — a JSON file, for running locally and for the tests;
 *  • neither configured → recording is off and the dashboard falls back to this browser's own records (src/stores/team.ts).
 * Recording is best-effort by design: if the store is down the sign-in still succeeds, it is just not recorded.
 * What is kept per sign-in: the account, the time, a coarse device ("Chrome · Windows") and the country the host reports — no IP address, no full User-Agent.
 */
export interface LoginEvent {
  /** the account as it signed in (Nilesh, Kiran, an added user's lower-case Login ID) */
  id: string;
  /** ISO time of the successful sign-in */
  at: string;
  device?: string;
  /** two-letter country code, when the host provides one */
  country?: string;
}
export interface UserLogins {
  id: string;
  count: number;
  last: string | null;
  /** newest first */
  history: LoginEvent[];
}

export const HISTORY_CAP = 500; // the count keeps counting; only the oldest lines are dropped
const READ_HISTORY = 200; // lines per user the dashboard asks for
const P = "nf:logins:";

type Backend = { kind: "redis"; url: string; token: string } | { kind: "file"; path: string };
function backend(): Backend | null {
  const file = process.env.LOGIN_STORE;
  if (file?.startsWith("file:")) return { kind: "file", path: file.slice(5) };
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { kind: "redis", url: url.replace(/\/+$/, ""), token } : null;
}
/** "redis" | "file" | null (recording is off). */
export const loginStoreKind = () => backend()?.kind ?? null;

const keyOf = (id: string) => id.trim().toLowerCase();

// ── Redis over HTTP ──────────────────────────────────────────────────────────────────────────────────────────────────
type Cmd = Array<string | number>;
async function pipeline(b: Extract<Backend, { kind: "redis" }>, commands: Cmd[], timeoutMs: number): Promise<unknown[]> {
  const res = await fetch(`${b.url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${b.token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`login store answered ${res.status}`);
  const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  const bad = out.find((o) => o.error);
  if (bad) throw new Error(`login store: ${bad.error}`);
  return out.map((o) => o.result);
}
/** HGETALL answers a flat [field, value, …] list (or an object, depending on the server): both become a Record. */
const asRecord = (v: unknown): Record<string, string> => {
  if (Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < v.length; i += 2) out[String(v[i])] = String(v[i + 1]);
    return out;
  }
  return v && typeof v === "object" ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, String(x)])) : {};
};
const parseEvent = (raw: unknown): LoginEvent | null => {
  try {
    const e = typeof raw === "string" ? JSON.parse(raw) : raw;
    return e && typeof e.id === "string" && typeof e.at === "string" ? { id: e.id, at: e.at, device: typeof e.device === "string" ? e.device : undefined, country: typeof e.country === "string" ? e.country : undefined } : null;
  } catch {
    return null;
  }
};

// ── a JSON file (local runs, tests) ──────────────────────────────────────────────────────────────────────────────────
interface FileData {
  users: Record<string, { id: string; count: number; last: string | null; history: LoginEvent[] }>;
}
let queue: Promise<unknown> = Promise.resolve();
/** Serialises file access inside this process so two sign-ins never overwrite each other. */
const exclusive = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
};
async function fileLoad(path: string): Promise<FileData> {
  const { readFile } = await import("node:fs/promises");
  try {
    const d = JSON.parse(await readFile(path, "utf8")) as FileData;
    return d?.users ? d : { users: {} };
  } catch {
    return { users: {} };
  }
}
async function fileSave(path: string, data: FileData) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data));
}

// ── the three operations ─────────────────────────────────────────────────────────────────────────────────────────────
/** Records one successful sign-in. Resolves quietly when recording is off; rejects if the store fails (the caller decides to ignore that). */
export async function recordLogin(e: LoginEvent, timeoutMs = 1500): Promise<void> {
  const b = backend();
  if (!b) return;
  const k = keyOf(e.id);
  if (b.kind === "redis") {
    await pipeline(
      b,
      [
        ["HINCRBY", `${P}count`, k, 1],
        ["HSET", `${P}last`, k, e.at],
        ["SADD", `${P}users`, k],
        ["LPUSH", `${P}u:${k}`, JSON.stringify(e)],
        ["LTRIM", `${P}u:${k}`, 0, HISTORY_CAP - 1],
      ],
      timeoutMs,
    );
    return;
  }
  await exclusive(async () => {
    const data = await fileLoad(b.path);
    const u = data.users[k] ?? { id: e.id, count: 0, last: null, history: [] };
    u.count += 1;
    u.last = e.at;
    u.history = [e, ...u.history].slice(0, HISTORY_CAP);
    data.users[k] = u;
    await fileSave(b.path, data);
  });
}

/** Every account that has signed in, with its count, last sign-in and recent history. Empty when recording is off. */
export async function readLogins(): Promise<UserLogins[]> {
  const b = backend();
  if (!b) return [];
  if (b.kind === "redis") {
    const [count, last, members] = await pipeline(b, [["HGETALL", `${P}count`], ["HGETALL", `${P}last`], ["SMEMBERS", `${P}users`]], 3000);
    const ids = Array.isArray(members) ? members.map(String) : [];
    const counts = asRecord(count);
    const lasts = asRecord(last);
    const lists = ids.length ? await pipeline(b, ids.map((k) => ["LRANGE", `${P}u:${k}`, 0, READ_HISTORY - 1]), 3000) : [];
    return ids
      .map((k, i) => {
        const history = (Array.isArray(lists[i]) ? (lists[i] as unknown[]) : []).map(parseEvent).filter((x): x is LoginEvent => !!x);
        return { id: history[0]?.id ?? k, count: Number(counts[k]) || history.length, last: lasts[k] ?? history[0]?.at ?? null, history };
      })
      .sort((a, c) => a.id.localeCompare(c.id));
  }
  const data = await exclusive(() => fileLoad(b.path));
  return Object.values(data.users).map((u) => ({ id: u.id, count: u.count, last: u.last, history: u.history.slice(0, READ_HISTORY) })).sort((a, c) => a.id.localeCompare(c.id));
}

/** Forgets one account's records, or everyone's. */
export async function clearLogins(id?: string): Promise<void> {
  const b = backend();
  if (!b) return;
  if (b.kind === "redis") {
    const ids = id ? [keyOf(id)] : (((await pipeline(b, [["SMEMBERS", `${P}users`]], 3000))[0] as string[] | undefined) ?? []).map(String);
    if (!ids.length) return;
    await pipeline(
      b,
      ids.flatMap((k) => [["HDEL", `${P}count`, k], ["HDEL", `${P}last`, k], ["SREM", `${P}users`, k], ["DEL", `${P}u:${k}`]]),
      3000,
    );
    return;
  }
  await exclusive(async () => {
    const data = await fileLoad(b.path);
    if (id) delete data.users[keyOf(id)];
    else data.users = {};
    await fileSave(b.path, data);
  });
}
