// Accounts, roles and the admin login dashboard, end to end.
//   node scripts/qa/roles.cjs                      starts its own throwaway production server (port 3102) with two made-up accounts and random passwords
//   node scripts/qa/roles.cjs http://localhost:3200 --admin-id Nilesh --admin-pw … --user-id Kiran --user-pw …   test a server you started with SITE_USERS yourself
// Needs a production build (scripts/qa/prod.sh) when it starts its own server. The real passwords are never in the repository: this uses its own.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const given = process.argv.find((a) => a.startsWith("http"));
const ADMIN = { id: flag("--admin-id", "Nilesh"), pw: flag("--admin-pw", crypto.randomBytes(9).toString("base64url")) };
const USER = { id: flag("--user-id", "Kiran"), pw: flag("--user-pw", crypto.randomBytes(9).toString("base64url")) };
const PORT = 3102;
// With a login store (the default here: a JSON file) the dashboard shows every sign-in from every browser; --no-store runs the fallback that reads this browser's own records.
const NO_STORE = process.argv.includes("--no-store");
const STORE_FILE = path.join(os.tmpdir(), `nf-roles-logins-${process.pid}.json`);
const BASE = given ?? `http://localhost:${PORT}`;
let failures = 0;
const step = async (name, fn) => { try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 260)}`); } };
const must = (c, m) => { if (!c) throw new Error(m); };

const records = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith("nf.logins.v1.")).map((k) => [k.slice("nf.logins.v1.".length), JSON.parse(localStorage.getItem(k))])));
const signIn = async (page, who, pw = who.pw) => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.fill("#uid", who.id);
  await page.fill("#pw", pw);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/__gate")), page.click("button[type=submit]")]);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !document.cookie.includes("nf_login_event"), null, { timeout: 10000 }); // the recorder has consumed the one-time event
};
const logOut = async (page) => { await Promise.all([page.waitForURL(BASE + "/"), page.getByRole("button", { name: "Log out" }).first().click()]); await page.waitForLoadState("networkidle"); };
const cell = (page, rowName, col) => page.getByRole("row", { name: new RegExp(rowName) }).first().getByRole(col === 0 ? "rowheader" : "cell").nth(col === 0 ? 0 : col - 1);

(async () => {
  let server;
  if (!given) {
    const users = JSON.stringify([{ id: ADMIN.id, password: ADMIN.pw, role: "admin" }, { id: USER.id, password: USER.pw, role: "user", title: "Director" }]);
    const env = { ...process.env, SITE_USERS: users, GATE_SECRET: crypto.randomBytes(24).toString("base64url") };
    delete env.LOGIN_STORE; delete env.KV_REST_API_URL; delete env.KV_REST_API_TOKEN;
    if (!NO_STORE) { try { fs.rmSync(STORE_FILE); } catch {} env.LOGIN_STORE = `file:${STORE_FILE}`; }
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { env, detached: true, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 1000)); up = await fetch(BASE + "/", { headers: { accept: "text/html" } }).then((r) => r.ok, () => false); }
    if (!up) { console.log("could not start the test server (is there a production build?)"); try { process.kill(-server.pid); } catch {} process.exit(1); }
  }
  const browser = require("./quiet.cjs")(await chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/status of (401|403)|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  console.log(`Roles — ${BASE}${given ? "" : NO_STORE ? " (no login store: browser-only records)" : " (login store: file)"}`);
  let STORE_ON = false;

  await step("a stranger gets the Login ID + password page and nothing behind it (pages, session, files)", async () => {
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    must(await page.locator("#uid").count() === 1 && await page.locator("#pw").count() === 1, "no Login ID / password fields");
    must(!(await page.content()).includes("Total logins"), "dashboard markup leaked to a stranger");
    must((await page.request.get(BASE + "/api/session", { failOnStatusCode: false })).status() === 401, "/api/session is open");
    must((await page.request.get(BASE + "/package.json", { failOnStatusCode: false })).status() === 401, "files are open");
  });

  await step("a wrong password or an unknown Login ID is refused and records nothing", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    for (const [id, pw] of [[USER.id, "definitely-not-it"], ["nobody", USER.pw]]) {
      await page.fill("#uid", id); await page.fill("#pw", pw); await page.click("button[type=submit]");
      await page.locator("#err").waitFor();
      must(/Login ID or password/.test(await page.locator("#err").innerText()), "no clear error");
    }
    must(Object.keys(await records(page)).length === 0, "a failed sign-in left a record");
  });

  await step("the regular user signs in: role checked, one login recorded, no admin link", async () => {
    await signIn(page, USER);
    const chip = page.getByRole("group", { name: "Your session" });
    await chip.waitFor();
    const text = await chip.innerText();
    must(text.includes(USER.id) && text.includes("Director"), `top bar says: ${text}`);
    must((await page.getByRole("link", { name: /Admin dashboard/ }).count()) === 0, "the admin link is shown to a regular user");
    const r = await records(page);
    must(r[USER.id.toLowerCase()]?.count === 1 && r[USER.id.toLowerCase()].history.length === 1 && !Number.isNaN(Date.parse(r[USER.id.toLowerCase()].history[0].at)), `records: ${JSON.stringify(r)}`);
    must(!r[ADMIN.id.toLowerCase()], "the other user's record was touched");
    const s = await (await page.request.get(BASE + "/api/session")).json();
    must(s.user.role === "user" && s.accounts === undefined, `session: ${JSON.stringify(s)}`);
  });

  await step("refreshing, navigating and reopening do not add logins; the record persists", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.goto(BASE + "/c/women", { waitUntil: "networkidle" });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    must((await records(page))[USER.id.toLowerCase()].count === 1, "a refresh counted as a login");
  });

  await step("the regular user cannot open /admin (403 from the server) or read the statistics", async () => {
    const res = await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    must(res.status() === 403, `status ${res.status()}`);
    must(/Admin only/.test(await page.locator("body").innerText()) && !(await page.content()).includes("Total logins"), "dashboard visible to a regular user");
    must((await page.request.get(BASE + "/admin", { failOnStatusCode: false, headers: { accept: "application/json" } })).status() === 403, "non-HTML request not refused");
  });

  await step("logout ends the session on the server and keeps the records", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await logOut(page);
    must(await page.locator("#uid").count() === 1, "not back at the sign-in page");
    must(!(await ctx.cookies()).some((c) => c.name === "nf_session"), "session cookie survived logout");
    must((await page.request.get(BASE + "/api/session", { failOnStatusCode: false })).status() === 401, "still signed in");
    must((await records(page))[USER.id.toLowerCase()].count === 1, "logout wiped the record");
  });

  await step("the admin signs in: role checked, dashboard link shown, both users' totals visible", async () => {
    await signIn(page, ADMIN);
    const chip = page.getByRole("group", { name: "Your session" });
    must((await chip.innerText()).includes("Admin"), "top bar does not say Admin");
    await Promise.all([page.waitForURL(/\/admin$/), page.getByRole("link", { name: /Admin dashboard/ }).first().click()]);
    await page.getByRole("heading", { name: "Totals" }).waitFor();
    await page.getByText("Reading the sign-in records").waitFor({ state: "detached", timeout: 15000 });
    STORE_ON = /Recorded on the server/.test(await page.getByRole("complementary", { name: "About these records" }).innerText());
    must(STORE_ON === !(NO_STORE) || !!given, `the dashboard is ${STORE_ON ? "" : "not "}reading from the server, expected ${NO_STORE ? "browser records" : "the server"}`);
    const dt = (label) => page.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]").innerText();
    must((await dt("Total logins")).trim() === "2", `total: ${await dt("Total logins")}`);
    must((await dt(USER.id)).trim() === "1" && (await dt(ADMIN.id)).trim() === "1", "per-user counts");
    must(/\d{2} \w{3} \d{4}/.test(await page.locator("#history-h").locator("xpath=..").innerText()), "no dated history lines");
    const rowText = await page.getByRole("row", { name: new RegExp(USER.id) }).first().innerText();
    must(/\d{2} \w{3} \d{4}, \d{2}:\d{2}:\d{2}/.test(rowText), `Kiran's last login: ${rowText}`);
  });

  await step("a second admin login counts; a failed one does not; counts stay separate", async () => {
    await logOut(page);
    await page.fill("#uid", ADMIN.id); await page.fill("#pw", "wrong-wrong"); await page.click("button[type=submit]"); await page.locator("#err").waitFor();
    must((await records(page))[ADMIN.id.toLowerCase()].count === 1, "a failed login was counted");
    await signIn(page, ADMIN);
    const r = await records(page);
    must(r[ADMIN.id.toLowerCase()].count === 2 && r[USER.id.toLowerCase()].count === 1, JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.count]))));
  });

  await step("admin controls: clearing one user's history leaves the other's", async () => {
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: new RegExp(`Clear ${USER.id}`) }).click();
    await page.getByRole("button", { name: "Yes, clear" }).click();
    await page.getByRole("status").filter({ hasText: /cleared/ }).waitFor();
    const r = await records(page);
    must(!r[USER.id.toLowerCase()] && r[ADMIN.id.toLowerCase()].count === 2, JSON.stringify(Object.keys(r)));
  });

  // ── server-side records ───────────────────────────────────────────────────────────────────────────────────────
  const DEVICE_B = { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const dash = async (p) => { await p.goto(BASE + "/admin", { waitUntil: "networkidle" }); await p.getByRole("heading", { name: "Totals" }).waitFor(); await p.getByText("Reading the sign-in records").waitFor({ state: "detached", timeout: 15000 }); };
  const tile = (p, label) => p.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]").innerText().then((t) => t.trim());

  await step(NO_STORE ? "no login store: the dashboard says its records are this browser's only" : "login store: the admin's dashboard shows a sign-in made on another device — with its date, time and device — and the admin's own browser never saw it", async () => {
    await dash(page);
    if (NO_STORE) {
      must(/Recorded in this browser only/.test(await page.getByRole("complementary", { name: "About these records" }).innerText()), "the browser-only notice is missing");
      return;
    }
    must((await tile(page, USER.id)).split("\n")[0] === "0", `Kiran starts at ${await tile(page, USER.id)} after his history was cleared`);
    const dev = await browser.newContext(DEVICE_B); // another browser on another device
    const dp = await dev.newPage();
    await signIn(dp, USER);
    await dev.close();
    must(!(await records(page))[USER.id.toLowerCase()], "the admin's browser has a record of a sign-in it never saw");
    await dash(page);
    must((await tile(page, USER.id)).split("\n")[0] === "1", `Kiran's count on the admin's dashboard: ${await tile(page, USER.id)}`);
    const hist = await page.locator("h3", { hasText: new RegExp(USER.id) }).locator("xpath=..").innerText();
    must(/\d{2} \w{3} \d{4}/.test(hist) && /\d{2}:\d{2}:\d{2}/.test(hist) && /Safari · iOS/.test(hist), `history: ${hist.replace(/\n/g, " | ")}`);
  });

  await step(NO_STORE ? "no login store: the server's records endpoint answers that recording is off" : "login store: a failed sign-in is not counted; a second sign-in is; the admin API is closed to everyone else; Clear removes the records from the server", async () => {
    if (NO_STORE) {
      const r = await page.evaluate(() => fetch("/api/admin/logins").then((x) => x.json()));
      must(r.store === null, `store: ${JSON.stringify(r)}`);
      return;
    }
    const dev = await browser.newContext(DEVICE_B);
    const dp = await dev.newPage();
    await dp.goto(BASE + "/", { waitUntil: "networkidle" });
    await dp.fill("#uid", USER.id); await dp.fill("#pw", "wrong-wrong"); await dp.click("button[type=submit]"); await dp.locator("#err").waitFor();
    await signIn(dp, USER, USER.pw);
    // a regular user and a stranger cannot read or clear the records
    await dp.goto(BASE + "/", { waitUntil: "networkidle" });
    must((await dp.evaluate(() => fetch("/api/admin/logins").then((x) => x.status))) === 403, "a regular user read the login records");
    must((await dp.evaluate(() => fetch("/api/admin/logins", { method: "DELETE", headers: { "content-type": "application/json" }, body: "{}" }).then((x) => x.status))) === 403, "a regular user cleared the login records");
    await dev.close();
    const stranger = await browser.newContext();
    const sp = await stranger.newPage();
    await sp.goto(BASE + "/", { waitUntil: "networkidle" });
    must((await sp.evaluate(() => fetch("/api/admin/logins").then((x) => x.status))) === 401, "a stranger reached the login records");
    await stranger.close();
    await dash(page);
    must((await tile(page, USER.id)).split("\n")[0] === "2", `Kiran should be at 2 (one failed attempt not counted): ${await tile(page, USER.id)}`);
    must((await tile(page, "Total logins")).split("\n")[0] === String(Number((await tile(page, ADMIN.id)).split("\n")[0]) + 2), "the total is not the sum of the accounts");
    await page.getByRole("button", { name: new RegExp(`Clear ${USER.id}`) }).click();
    await page.getByRole("button", { name: "Yes, clear" }).click();
    await page.getByRole("status").filter({ hasText: /cleared on the server/ }).waitFor();
    await dash(page);
    must((await tile(page, USER.id)).split("\n")[0] === "0", "Clear did not remove the records from the server");
  });

  // ── Add user (sign-ins issued from the dashboard) ─────────────────────────────────────────────────────────────
  const NEW = { id: "test.reviewer", pw: "" };
  await step("the admin adds a user from the dashboard: Login ID suggested from the name, a password and an end date are shown", async () => {
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    must((await page.getByRole("link", { name: "Add a user" }).count()) === 1, "no Add a user link at the top of the dashboard");
    const form = page.getByRole("form", { name: "Add a user" });
    await form.getByLabel("Full name").fill("Test Reviewer");
    must((await form.getByLabel("Login ID").inputValue()) === "test.reviewer", `suggested ID: ${await form.getByLabel("Login ID").inputValue()}`);
    await form.getByLabel("Access lasts").selectOption("3");
    await form.getByRole("button", { name: "Add user" }).click();
    const result = page.getByRole("status", { name: "New sign-in" });
    await result.waitFor();
    const text = await result.innerText();
    const pw = /\b([0-9A-Z]{4}(?:-[0-9A-Z]{4}){3})\b/.exec(text)?.[1];
    must(pw, `no password in: ${text}`);
    must(/test\.reviewer/.test(text) && /access ends/i.test(text), `details missing: ${text}`);
    NEW.pw = pw;
    const row = page.getByRole("row", { name: /test\.reviewer/ });
    must((await row.count()) === 1 && /Active/.test(await row.innerText()) && /Regular user/.test(await row.innerText()), "no Active row for the new user in Accounts");
  });

  await step("the new user signs in on another device as a regular user: no admin link, /admin refused, own record", async () => {
    const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dp = await d.newPage();
    await signIn(dp, NEW);
    const chip = dp.getByRole("group", { name: "Your session" });
    await chip.waitFor();
    const t = await chip.innerText();
    must(/Test Reviewer/.test(t) && /Guest/.test(t), `top bar says: ${t}`);
    must((await dp.getByRole("link", { name: /Admin dashboard/ }).count()) === 0, "admin link shown to an added user");
    const s = await (await dp.request.get(BASE + "/api/session")).json();
    must(s.user.role === "user" && s.accounts === undefined, `session: ${JSON.stringify(s)}`);
    must((await dp.goto(BASE + "/admin")).status() === 403, "/admin not refused");
    const add = await dp.request.post(BASE + "/api/admin/users", { data: { id: "sneaky.user", days: 7 }, failOnStatusCode: false });
    must(add.status() === 403, `an added user could call the add-user API (${add.status()})`);
    must((await dp.request.post(BASE + "/api/admin/users/password", { data: { id: "sneaky.user", expiresAt: new Date(Date.now() + 36e5).toISOString() }, failOnStatusCode: false })).status() === 403, "an added user could call the reveal API");
    must((await records(dp))[NEW.id]?.count === 1, `record: ${JSON.stringify(await records(dp))}`);
    await dp.goto(BASE + "/", { waitUntil: "networkidle" }); // the 403 page has no site chrome, so go back before signing out
    await logOut(dp);
    // typed the way people type it: lower case, no dashes
    await signIn(dp, NEW, NEW.pw.toLowerCase().replaceAll("-", ""));
    must((await records(dp))[NEW.id]?.count === 2, "second sign-in not recorded");
    await d.close();
  });

  await step("a wrong password for the new Login ID, and the regular user calling the add-user API, are refused", async () => {
    const d = await browser.newContext();
    const dp = await d.newPage();
    await dp.goto(BASE + "/", { waitUntil: "networkidle" });
    await dp.fill("#uid", NEW.id); await dp.fill("#pw", NEW.pw.slice(0, -1) + (NEW.pw.endsWith("0") ? "1" : "0")); await dp.click("button[type=submit]");
    await dp.locator("#err").waitFor();
    must(Object.keys(await records(dp)).length === 0, "a failed sign-in left a record");
    await d.close();
    const k = await browser.newContext();
    const kp = await k.newPage();
    await signIn(kp, USER);
    must((await kp.request.post(BASE + "/api/admin/users", { data: { id: "sneaky.user", days: 7 }, failOnStatusCode: false })).status() === 403, "the regular user could add a user");
    await k.close();
    must((await (await browser.newContext()).request.post(BASE + "/api/admin/users", { data: { id: "x.y.z", days: 7 }, failOnStatusCode: false })).status() === 401, "a stranger reached the add-user API");
  });

  await step("the form refuses bad Login IDs; the list can show the password again and tidy itself without ending access", async () => {
    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    const form = page.getByRole("form", { name: "Add a user" });
    await form.getByLabel("Login ID").fill("ab");
    await form.getByLabel("Login ID").blur();
    must(/3–24/.test(await form.innerText()) && (await form.getByRole("button", { name: "Add user" }).isDisabled()), "a two-letter ID was allowed");
    await form.getByLabel("Login ID").fill(USER.id);
    await form.getByRole("button", { name: "Add user" }).click();
    await form.getByRole("alert").filter({ hasText: /built-in/ }).waitFor();
    // show password again: recomputed, identical
    await page.getByRole("button", { name: "Show password" }).first().click();
    await page.getByText(NEW.pw).first().waitFor();
    await page.getByRole("button", { name: "Remove from list" }).first().click();
    await page.getByRole("row", { name: /test\.reviewer/ }).waitFor({ state: "detached" });
    const d = await browser.newContext();
    const dp = await d.newPage();
    await signIn(dp, NEW); // still works: removing a row from the list does not end access
    must((await records(dp))[NEW.id]?.count === 1, "the removed user could not sign in");
    await d.close();
  });

  await step("a forged or edited session cookie does not open the site or the admin page", async () => {
    await logOut(page);
    const forged = `9999999999.${Buffer.from(ADMIN.id).toString("base64url")}.${"0".repeat(64)}`;
    await ctx.addCookies([{ name: "nf_session", value: forged, url: BASE }]);
    const res = await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    must(await page.locator("#uid").count() === 1 && !(await page.content()).includes("Total logins"), `status ${res.status()}: a forged cookie was accepted`);
    await ctx.clearCookies();
  });

  await step("phone: the menu carries the signed-in block and Log out (no admin link for a regular user)", async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mp = await m.newPage();
    await signIn(mp, USER);
    await mp.getByRole("button", { name: "Open menu" }).click();
    const block = mp.getByRole("dialog", { name: "Menu" }).getByRole("group", { name: "Your session" });
    await block.waitFor();
    must((await block.innerText()).includes(USER.id), "no signed-in block in the menu");
    must((await block.getByRole("link", { name: /Admin dashboard/ }).count()) === 0 && (await block.getByRole("button", { name: "Log out" }).count()) === 1, "menu block wrong");
    await m.close();
  });

  await step("phone: the admin dashboard and the Add user form fit a 390px screen", async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mp = await m.newPage();
    await signIn(mp, ADMIN);
    await mp.goto(BASE + "/admin", { waitUntil: "networkidle" });
    const form = mp.getByRole("form", { name: "Add a user" });
    await form.getByLabel("Full name").fill("Phone Tester");
    await form.getByRole("button", { name: "Add user" }).click();
    await mp.getByRole("status", { name: "New sign-in" }).waitFor();
    await mp.getByRole("button", { name: "Show password" }).first().click();
    await mp.waitForTimeout(400);
    const m1 = await mp.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: innerWidth,
      out: [...document.querySelectorAll("#access input, #access select, #access button, #access [role=status]")].filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5 && !e.closest("[role=region]")).map((e) => e.tagName + ":" + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24)),
    }));
    must(m1.sw <= m1.iw + 1, `the page is ${m1.sw}px wide on a ${m1.iw}px screen`);
    must(m1.out.length === 0, `controls stick out of the screen: ${m1.out.join(", ")}`);
    await m.close();
  });

  must(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await browser.close();
  if (server) try { process.kill(-server.pid, "SIGTERM"); } catch {}
  console.log(failures ? `\n${failures} roles check(s) failed` : "\nAccounts and roles OK");
  process.exit(failures ? 1 : 0);
})();
