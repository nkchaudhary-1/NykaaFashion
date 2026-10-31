// WCAG 2.1 A/AA audit with axe-core (install with: npm i --no-save axe-core).
//   node scripts/qa/a11y.cjs [baseUrl] [--mobile] [--only /path,/path2]
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const mobile = process.argv.includes("--mobile");
const onlyArg = process.argv.indexOf("--only");
const PAGES = onlyArg > -1 ? process.argv[onlyArg + 1].split(",") : [
  "/", "/discover", "/discover/the-block-print-revival", "/edits", "/edits/hidden-gems", "/c/women/dresses", "/p/poppy-smocked-midi-dress",
  "/p/satin-corset-top", "/search?q=kurta", "/brands", "/brands/ajrakh-and-ash", "/offers", "/wishlist", "/bag", "/login", "/help", "/prototype", "/info/shipping",
];
const AUTHED = ["/checkout", "/account", "/account/orders", "/account/orders/nf-26100377", "/account/addresses"];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" }); // mid-reveal opacity would skew colour-contrast results
  const page = await ctx.newPage();
  let total = 0;
  const audit = async (path) => {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.addScriptTag({ path: axePath });
    const r = await page.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
    const v = r.violations;
    total += v.length;
    console.log(`${v.length ? "✗" : "✓"} ${path}  (${v.length} violation types)`);
    for (const x of v) console.log(`    [${x.impact}] ${x.id} ×${x.nodes.length} — ${x.help}\n        ${x.nodes.slice(0, 2).map((n) => n.target.join(" ").slice(0, 110)).join("\n        ")}`);
  };
  console.log(`axe audit — ${mobile ? "mobile" : "desktop"}`);
  for (const p of PAGES) await audit(p);
  // sign in as the demo account for authenticated surfaces
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Use the demo account/ }).click();
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("One-time code").fill("123456");
  await page.waitForURL(/\/account$/);
  // put something in the bag so /checkout is reachable
  await page.goto(BASE + "/p/linen-shirt-dress", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /^Size M/ }).check({ force: true });
  await page.getByRole("button", { name: "Add to bag" }).first().click();
  for (const p of AUTHED) await audit(p);
  console.log(total ? `\n${total} violation types in total` : "\nNo axe violations");
  await browser.close();
})();
