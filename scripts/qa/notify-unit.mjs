// The sign-in notification (src/lib/notify.ts), tested in Node: one plain line with the date and time and nothing else; nothing sent when it is not configured;
// the right shape for ntfy / any plain-text endpoint, Discord and Slack; and a slow, failing or unreachable endpoint fails fast so a sign-in is never held up.
//   node scripts/qa/notify-unit.mjs
import { createServer } from "node:http";

delete process.env.LOGIN_NOTIFY_URL;
const { notifyUserSignIn, signInMessage, whenIST } = await import("../../src/lib/notify.ts");
let failures = 0;
const check = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0]}`); } };
const must = (c, m) => { if (!c) throw new Error(m); };
console.log("Sign-in notification — src/lib/notify.ts");

const received = [];
let mode = "ok";
const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    received.push({ method: req.method, url: req.url, headers: req.headers, body });
    if (mode === "hang") return;
    res.writeHead(mode === "fail" ? 500 : 200).end("ok");
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL_OK = `http://127.0.0.1:${server.address().port}/a-long-random-topic`;

await check("the message: one plain line, the date and time in IST, nothing else", () => {
  must(whenIST(new Date("2026-10-31T11:12:00Z")) === "Sat, 31 Oct 2026, 4:42 pm IST", whenIST(new Date("2026-10-31T11:12:00Z")));
  must(whenIST(new Date("2026-10-31T18:30:00Z")) === "Sun, 1 Nov 2026, 12:00 am IST", whenIST(new Date("2026-10-31T18:30:00Z")));
  must(whenIST(new Date("2026-11-14T06:30:00Z")) === "Sat, 14 Nov 2026, 12:00 pm IST", whenIST(new Date("2026-11-14T06:30:00Z")));
  const m = signInMessage(new Date("2026-10-31T11:12:00Z"));
  must(m === "Someone signed in to the prototype — Sat, 31 Oct 2026, 4:42 pm IST", m);
  must(!/[@#]|id|user ?name|device|ip |browser|chrome|safari/i.test(m.replace("Someone signed in to the prototype", "")), "the message carries more than the time");
});

await check("not configured: nothing is sent and nothing fails", async () => {
  await notifyUserSignIn();
  process.env.LOGIN_NOTIFY_URL = "   ";
  await notifyUserSignIn();
  must(received.length === 0, `${received.length} request(s) were sent`);
});

await check("a plain-text endpoint (ntfy.sh, anything else): a POST with the line as its text body", async () => {
  process.env.LOGIN_NOTIFY_URL = URL_OK;
  await notifyUserSignIn(new Date("2026-10-31T11:12:00Z"));
  const r = received.at(-1);
  must(received.length === 1 && r.method === "POST" && r.url === "/a-long-random-topic", `${r?.method} ${r?.url}`);
  must(/^text\/plain/.test(r.headers["content-type"]) && r.body === "Someone signed in to the prototype — Sat, 31 Oct 2026, 4:42 pm IST", `${r.headers["content-type"]} / ${r.body}`);
  must(r.headers.title === "Prototype opened", `title: ${r.headers.title}`);
  must(!r.headers.cookie && !r.headers.authorization && !r.headers.referer, "the request carries credentials or a referrer");
});

await check("Discord and Slack webhooks get the JSON they expect (same single line)", async () => {
  const real = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, init) => { sent.push({ url, init }); return new Response(null, { status: 204 }); };
  try {
    process.env.LOGIN_NOTIFY_URL = "https://discord.com/api/webhooks/123456/abcdef";
    await notifyUserSignIn(new Date("2026-10-31T11:12:00Z"));
    process.env.LOGIN_NOTIFY_URL = "https://hooks.slack.com/services/T000/B000/XXXX";
    await notifyUserSignIn(new Date("2026-10-31T11:12:00Z"));
  } finally { globalThis.fetch = real; }
  const line = "Someone signed in to the prototype — Sat, 31 Oct 2026, 4:42 pm IST";
  must(JSON.stringify(JSON.parse(sent[0].init.body)) === JSON.stringify({ content: line }) && sent[0].init.headers["content-type"] === "application/json", `discord: ${sent[0].init.body}`);
  must(JSON.stringify(JSON.parse(sent[1].init.body)) === JSON.stringify({ text: line }) && sent[1].init.headers["content-type"] === "application/json", `slack: ${sent[1].init.body}`);
});

await check("a failing, a hanging and an unreachable endpoint all fail fast — the caller ignores it and the sign-in is never held up", async () => {
  process.env.LOGIN_NOTIFY_URL = URL_OK;
  mode = "fail";
  let threw = false;
  try { await notifyUserSignIn(); } catch { threw = true; }
  must(threw, "a 500 was treated as delivered");
  mode = "hang";
  const t0 = Date.now();
  threw = false;
  try { await notifyUserSignIn(new Date(), 300); } catch { threw = true; }
  must(threw && Date.now() - t0 < 1500, `a hanging endpoint was waited for ${Date.now() - t0} ms`);
  mode = "ok";
  process.env.LOGIN_NOTIFY_URL = "http://127.0.0.1:1/x";
  threw = false;
  try { await notifyUserSignIn(); } catch { threw = true; }
  must(threw, "an unreachable endpoint did not fail");
});

server.closeAllConnections?.();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nSign-in notification OK");
process.exit(failures ? 1 : 0);
