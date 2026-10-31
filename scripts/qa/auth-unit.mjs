// Sign-ins issued from the admin dashboard, tested directly against src/lib/auth.ts (no server, no browser):
// the generated password is a signature over (Login ID, expiry) — so it must verify, and nothing else may.
//   node scripts/qa/auth-unit.mjs
process.env.SITE_USERS = JSON.stringify([
  { id: "Boss", password: "Boss-pass-1", role: "admin" },
  { id: "Guest1", password: "Guest-pass-1", role: "user", title: "Director" },
]);
process.env.GATE_SECRET = "unit-test-secret-" + "x".repeat(24);
delete process.env.SITE_REVOKED;

const auth = await import("../../src/lib/auth.ts");
let failures = 0;
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0]}`);
  }
};
const must = (c, m) => {
  if (!c) throw new Error(m);
};
const HOUR = 3_600_000;
console.log("Issued sign-ins — src/lib/auth.ts");

await check("built-in accounts still sign in, wrong passwords do not", async () => {
  must((await auth.verifyLogin("boss", "Boss-pass-1"))?.role === "admin", "admin did not sign in (ID is case-insensitive)");
  must((await auth.verifyLogin("Guest1", "Guest-pass-1"))?.title === "Director", "built-in user did not sign in");
  must((await auth.verifyLogin("Boss", "nope")) === null, "wrong password accepted");
  must((await auth.verifyLogin("nobody", "x")) === null, "unknown ID accepted");
});

let issued;
await check("an issued sign-in has a readable password and an expiry on the hour", async () => {
  issued = await auth.issueSignIn("Priya.Sharma", 7 * 24);
  must(issued.id === "priya.sharma" && issued.name === "Priya Sharma", `id/name: ${issued.id} / ${issued.name}`);
  must(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/.test(issued.password), `format: ${issued.password}`);
  const t = Date.parse(issued.expiresAt);
  must(t % HOUR === 0, "expiry is not on the hour");
  must(t - Date.now() > 6.9 * 24 * HOUR && t - Date.now() <= 7 * 24 * HOUR + HOUR, `expiry is ${(t - Date.now()) / HOUR} h away`);
});

await check("it signs in as a regular user, however the password is typed", async () => {
  const a = await auth.verifyLogin("priya.sharma", issued.password);
  must(a && a.role === "user" && a.title === "Guest" && a.until === Date.parse(issued.expiresAt) / 1000, `account: ${JSON.stringify(a)}`);
  for (const typed of [issued.password.toLowerCase(), issued.password.replaceAll("-", ""), `  ${issued.password.replaceAll("-", " ")} `])
    must(await auth.verifyLogin("PRIYA.sharma ", typed), `did not accept "${typed}"`);
});

await check("a changed ID, password, or expiry is refused", async () => {
  must((await auth.verifyLogin("priya.sharm", issued.password)) === null, "another ID accepted the password");
  const flip = (s) => s.slice(0, -1) + (s.at(-1) === "0" ? "1" : "0");
  must((await auth.verifyLogin("priya.sharma", flip(issued.password))) === null, "a changed signature was accepted");
  const later = issued.password.replace(/^..../, (g) => (g.slice(0, 3) + (g[3] === "Z" ? "Y" : "Z")));
  must((await auth.verifyLogin("priya.sharma", later)) === null, "a changed expiry was accepted");
  must((await auth.verifyLogin("priya.sharma", "")) === null && (await auth.verifyLogin("", issued.password)) === null, "empty input accepted");
});

await check("an expired sign-in is refused", async () => {
  const past = await auth.revealSignIn("old.user", new Date(Date.now() - 2 * HOUR).toISOString());
  must((await auth.verifyLogin("old.user", past.password)) === null, "expired sign-in accepted");
  const future = await auth.revealSignIn("old.user", new Date(Date.now() + 3 * HOUR).toISOString());
  must((await auth.verifyLogin("old.user", future.password))?.role === "user", "a future expiry was refused");
});

await check("revealing recomputes the same password; built-in IDs cannot be issued", async () => {
  const again = await auth.revealSignIn("priya.sharma", issued.expiresAt);
  must(again.password === issued.password, "reveal gave a different password");
  must(auth.issuedIdProblem("kiran") === null, "kiran is not built in here"); // the unit config has Boss and Guest1
  must(auth.issuedIdProblem("GUEST1"), "a built-in ID (any case) was allowed");
  must(auth.issuedIdProblem("ab") && auth.issuedIdProblem("-bad") && auth.issuedIdProblem("has space") && auth.issuedIdProblem("x".repeat(25)), "bad IDs were allowed");
  let threw = false;
  try { await auth.issueSignIn("boss", 24); } catch { threw = true; }
  must(threw, "issued a sign-in for a built-in ID");
});

await check("the session names the account, ends with the access, and cannot be forged", async () => {
  const account = await auth.verifyLogin("priya.sharma", issued.password);
  const token = await auth.issueSession(account.id, account.until);
  must(token.startsWith("i."), "issued sessions carry their own shape");
  const back = await auth.readSession(token);
  must(back && back.id === "priya.sharma" && back.role === "user", `session: ${JSON.stringify(back)}`);
  must(auth.sessionAge(account.until) <= auth.SESSION_MAX_AGE && auth.sessionAge(account.until) > 0, "cookie age");
  must(auth.sessionAge(Date.now() / 1000 + 600) <= 600, "the cookie outlives the access");
  const parts = token.split(".");
  must((await auth.readSession([parts[0], parts[1], btoa("boss"), parts[3]].join("."))) === null, "another ID in an issued token was accepted");
  must((await auth.readSession(`${parts[0]}.${Number(parts[1]) + 99999}.${parts[2]}.${parts[3]}`)) === null, "a longer expiry was accepted");
  must((await auth.readSession(token.slice(2))) === null, "an issued token read as a built-in one");
  const expired = await auth.issueSession("priya.sharma", Math.floor(Date.now() / 1000) - 5);
  must((await auth.readSession(expired)) === null, "an expired session was accepted");
  must((await auth.readSession(await auth.issueSession("Boss")))?.role === "admin", "a built-in session stopped working");
});

await check("SITE_REVOKED ends an issued sign-in and its sessions", async () => {
  const account = await auth.verifyLogin("priya.sharma", issued.password);
  const token = await auth.issueSession(account.id, account.until);
  process.env.SITE_REVOKED = " Sam , PRIYA.sharma ";
  must((await auth.verifyLogin("priya.sharma", issued.password)) === null, "revoked sign-in still works");
  must((await auth.readSession(token)) === null, "revoked session still works");
  delete process.env.SITE_REVOKED;
  must(await auth.verifyLogin("priya.sharma", issued.password), "removing it from SITE_REVOKED did not restore access");
});

await check("changing the secret ends every issued sign-in; editing SITE_USERS does not", async () => {
  const users = process.env.SITE_USERS;
  process.env.SITE_USERS = JSON.stringify([...JSON.parse(users), { id: "Extra", password: "Extra-pass-1", role: "user" }]);
  must(await auth.verifyLogin("priya.sharma", issued.password), "adding a built-in account ended issued sign-ins (GATE_SECRET is set)");
  process.env.SITE_USERS = users;
  const secret = process.env.GATE_SECRET;
  process.env.GATE_SECRET = "a-different-secret-" + "y".repeat(24);
  must((await auth.verifyLogin("priya.sharma", issued.password)) === null, "an issued sign-in survived a new secret");
  process.env.GATE_SECRET = secret;
});

await check("a Login ID that later becomes a built-in account cannot ride on an issued sign-in", async () => {
  const users = process.env.SITE_USERS;
  process.env.SITE_USERS = JSON.stringify([...JSON.parse(users), { id: "Priya.Sharma", password: "Another-pass-1", role: "admin" }]);
  must((await auth.verifyLogin("priya.sharma", issued.password)) === null, "issued password worked for a now built-in account");
  process.env.SITE_USERS = users;
});

console.log(failures ? `\n${failures} check(s) failed` : "\nIssued sign-ins OK");
process.exit(failures ? 1 : 0);
