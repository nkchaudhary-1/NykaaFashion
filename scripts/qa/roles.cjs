// Accounts, roles and the admin login dashboard, end to end.
//   node scripts/qa/roles.cjs                      starts its own throwaway production server (port 3102) with two made-up accounts and random passwords
//   node scripts/qa/roles.cjs http://localhost:3200 --admin-id Nilesh --admin-pw … --user-id Kiran --user-pw …   test a server you started with SITE_USERS yourself
// Needs a production build (scripts/qa/prod.sh) when it starts its own server. The real passwords are never in the repository: this uses its own.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");

const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const given = process.argv.find((a) => a.startsWith("http"));
const ADMIN = { id: flag("--admin-id", "Nilesh"), pw: flag("--admin-pw", crypto.randomBytes(9).toString("base64url")) };
const USER = { id: flag("--user-id", "Kiran"), pw: flag("--user-pw", crypto.randomBytes(9).toString("base64url")) };
const PORT = 3102;
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
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, SITE_USERS: users }, detached: true, stdio: "ignore" });
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 1000)); up = await fetch(BASE + "/", { headers: { accept: "text/html" } }).then((r) => r.ok, () => false); }
    if (!up) { console.log("could not start the test server (is there a production build?)"); try { process.kill(-server.pid); } catch {} process.exit(1); }
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && !/status of (401|403)|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  console.log(`Roles — ${BASE}`);

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

  must(errors.length === 0, `console errors: ${errors.join(" | ")}`);
  await browser.close();
  if (server) try { process.kill(-server.pid, "SIGTERM"); } catch {}
  console.log(failures ? `\n${failures} roles check(s) failed` : "\nAccounts and roles OK");
  process.exit(failures ? 1 : 0);
})();
