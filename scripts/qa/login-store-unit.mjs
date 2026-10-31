// Server-side sign-in records (src/lib/login-store.ts) and the device describer (src/lib/device.ts), tested in Node: the file backend, and the Redis-over-HTTP backend
// against a small in-memory stand-in for Upstash's /pipeline endpoint (so the exact commands the app sends are checked without a real database).
//   node scripts/qa/login-store-unit.mjs
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

delete process.env.LOGIN_STORE; delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN; delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
const { describeDevice } = await import("../../src/lib/device.ts");
const store = await import("../../src/lib/login-store.ts");
let failures = 0;
const check = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0]}`); } };
const must = (c, m) => { if (!c) throw new Error(m); };
const ev = (id, at, extra = {}) => ({ id, at, device: "Chrome · Windows", country: "IN", ...extra });
console.log("Sign-in records — src/lib/login-store.ts, src/lib/device.ts");

await check("device: a coarse 'Browser · System', never a version or an address", () => {
  const cases = [
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", "Chrome · Windows"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0", "Edge · Windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", "Safari · macOS"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "Safari · iOS"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36", "Chrome · Android"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0", "Firefox · Linux"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.37 Mobile/15E148 Safari/604.1", "Chrome · iOS"],
    ["", "Unknown device"],
  ];
  for (const [ua, want] of cases) must(describeDevice(ua) === want, `${ua.slice(0, 50)}… → ${describeDevice(ua)}, expected ${want}`);
});

await check("with nothing configured, recording is off: no store, nothing written, nothing read", async () => {
  must(store.loginStoreKind() === null, "a store is configured");
  await store.recordLogin(ev("Kiran", "2026-10-31T10:00:00Z"));
  must((await store.readLogins()).length === 0, "something was read");
  await store.clearLogins();
});

const dir = mkdtempSync(join(tmpdir(), "nf-logins-"));
const scenario = async (label) => {
  await check(`${label}: counts, last sign-in and newest-first history per account; accounts are told apart without regard to case`, async () => {
    await store.recordLogin(ev("Kiran", "2026-10-31T10:00:00Z"));
    await store.recordLogin(ev("Nilesh", "2026-10-31T10:05:00Z", { device: "Safari · macOS", country: "US" }));
    await store.recordLogin(ev("Kiran", "2026-10-31T11:30:00Z", { device: "Safari · iOS" }));
    await store.recordLogin({ id: "priya.sharma", at: "2026-10-31T12:00:00Z" }); // an added user, no device / country known
    await store.recordLogin(ev("kiran", "2026-10-31T12:30:00Z"));
    const all = await store.readLogins();
    const by = Object.fromEntries(all.map((u) => [u.id.toLowerCase(), u]));
    must(all.length === 3, `accounts: ${all.map((u) => u.id)}`);
    must(by.kiran.count === 3 && by.kiran.last === "2026-10-31T12:30:00Z", `kiran: ${JSON.stringify([by.kiran.count, by.kiran.last])}`);
    must(by.kiran.history.map((h) => h.at).join() === "2026-10-31T12:30:00Z,2026-10-31T11:30:00Z,2026-10-31T10:00:00Z", "history is not newest first");
    must(by.kiran.history[1].device === "Safari · iOS" && by.kiran.history[1].country === "IN", "device / country lost");
    must(by.nilesh.count === 1 && by.nilesh.history[0].country === "US", "nilesh");
    must(by["priya.sharma"].count === 1 && by["priya.sharma"].history[0].device === undefined, "added user");
  });
  await check(`${label}: many sign-ins at once are all counted`, async () => {
    await Promise.all(Array.from({ length: 25 }, (_, i) => store.recordLogin(ev("burst", `2026-11-01T00:00:${String(i).padStart(2, "0")}Z`))));
    must((await store.readLogins()).find((u) => u.id === "burst")?.count === 25, "a concurrent sign-in was lost");
  });
  await check(`${label}: clearing one account leaves the others; clearing all empties it`, async () => {
    await store.clearLogins("KIRAN");
    const left = (await store.readLogins()).map((u) => u.id.toLowerCase());
    must(!left.includes("kiran") && left.includes("nilesh") && left.includes("priya.sharma"), `left: ${left}`);
    await store.clearLogins();
    must((await store.readLogins()).length === 0, "not empty");
  });
};

process.env.LOGIN_STORE = `file:${join(dir, "nested", "logins.json")}`;
must(store.loginStoreKind() === "file", "file store not selected");
await scenario("file store");
delete process.env.LOGIN_STORE;

// ── Redis over HTTP, against a stand-in ──────────────────────────────────────────────────────────────────────────────
const TOKEN = "test-token-" + "x".repeat(16);
const hashes = new Map(), sets = new Map(), lists = new Map();
const used = new Set();
let hang = false;
const run = (cmd) => {
  const [name, key, ...a] = cmd;
  used.add(name);
  const h = () => (hashes.get(key) ?? hashes.set(key, new Map()).get(key));
  switch (name) {
    case "HINCRBY": { const m = h(); m.set(a[0], String((Number(m.get(a[0])) || 0) + Number(a[1]))); return Number(m.get(a[0])); }
    case "HSET": h().set(a[0], String(a[1])); return 1;
    case "HGETALL": return [...(hashes.get(key) ?? new Map())].flat();
    case "HDEL": hashes.get(key)?.delete(a[0]); return 1;
    case "SADD": (sets.get(key) ?? sets.set(key, new Set()).get(key)).add(String(a[0])); return 1;
    case "SMEMBERS": return [...(sets.get(key) ?? [])];
    case "SREM": sets.get(key)?.delete(String(a[0])); return 1;
    case "LPUSH": lists.set(key, [String(a[0]), ...(lists.get(key) ?? [])]); return lists.get(key).length;
    case "LTRIM": lists.set(key, (lists.get(key) ?? []).slice(Number(a[0]), Number(a[1]) + 1)); return "OK";
    case "LRANGE": return (lists.get(key) ?? []).slice(Number(a[0]), Number(a[1]) + 1);
    case "DEL": lists.delete(key); return 1;
    default: throw new Error(`ERR unknown command '${name}'`);
  }
};
const server = createServer((req, res) => {
  if (hang) return; // never answers
  if (req.headers.authorization !== `Bearer ${TOKEN}`) { res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" })); return; }
  if (req.method !== "POST" || req.url !== "/pipeline") { res.writeHead(404).end(); return; }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const out = JSON.parse(body).map((cmd) => { try { return { result: run(cmd) }; } catch (e) { return { error: e.message }; } });
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
process.env.KV_REST_API_URL = `http://127.0.0.1:${server.address().port}/`;
process.env.KV_REST_API_TOKEN = TOKEN;
must(store.loginStoreKind() === "redis", "redis store not selected");
await scenario("redis store");

await check("redis: only ordinary commands are used (HINCRBY, HSET, HGETALL, HDEL, SADD, SMEMBERS, SREM, LPUSH, LTRIM, LRANGE, DEL)", () => {
  const allowed = new Set(["HINCRBY", "HSET", "HGETALL", "HDEL", "SADD", "SMEMBERS", "SREM", "LPUSH", "LTRIM", "LRANGE", "DEL"]);
  for (const c of used) must(allowed.has(c), `unexpected command ${c}`);
});
await check("redis: a wrong token, an unreachable server and a server that never answers make recording fail fast (the caller ignores it, the sign-in is unaffected)", async () => {
  process.env.KV_REST_API_TOKEN = "wrong";
  let threw = false;
  try { await store.recordLogin(ev("Kiran", "2026-11-02T00:00:00Z")); } catch { threw = true; }
  must(threw, "a wrong token was accepted");
  process.env.KV_REST_API_TOKEN = TOKEN;
  hang = true;
  const t0 = Date.now();
  threw = false;
  try { await store.recordLogin(ev("Kiran", "2026-11-02T00:00:00Z"), 300); } catch { threw = true; }
  must(threw && Date.now() - t0 < 1500, `a hanging store was waited for ${Date.now() - t0} ms`);
  hang = false;
  process.env.KV_REST_API_URL = "http://127.0.0.1:1/";
  threw = false;
  try { await store.recordLogin(ev("Kiran", "2026-11-02T00:00:00Z")); } catch { threw = true; }
  must(threw, "an unreachable store did not fail");
});

server.close();
rmSync(dir, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed` : "\nSign-in records OK");
process.exit(failures ? 1 : 0);
