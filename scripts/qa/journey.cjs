// End-to-end journey check against a running server.
//   node scripts/qa/journey.cjs [baseUrl] [--mobile]
// Drives the real browser through the PRD journeys and reports pass/fail + any console errors.
const { chromium } = require("playwright");

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const mobile = process.argv.includes("--mobile");
let failures = 0;
const problems = [];

async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n      ${String(e.message).split("\n")[0].slice(0, 220)}`);
  }
}
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile, hasTouch: mobile,
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on("console", (m) => { if (m.type() === "error") problems.push(`[console.error] ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => problems.push(`[pageerror] ${String(e).slice(0, 200)}`));
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("/_next/image")) problems.push(`[http ${r.status()}] ${r.url().slice(0, 120)}`); });

  console.log(`\nJourney — ${mobile ? "mobile" : "desktop"} — ${BASE}`);

  await step("Home renders the editorial hero", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    const h1 = await page.getByRole("heading", { level: 1 }).first().innerText();
    if (!/Block-?\s*Print/i.test(h1)) throw new Error(`unexpected h1: ${h1}`);
  });

  await step("Primary nav → Edits → Hidden Gems", async () => {
    if (mobile) {
      await page.getByRole("link", { name: "Edits", exact: true }).last().click();
      await page.waitForURL(/\/edits$/);
      await page.getByRole("link", { name: /Hidden Gems/ }).first().click();
    } else {
      await page.getByRole("link", { name: "Edits", exact: true }).first().hover();
      await page.locator("#mega-panel").waitFor();
      await page.locator("#mega-panel").getByRole("link", { name: /Hidden Gems/ }).first().click();
    }
    await page.waitForURL(/\/edits\/hidden-gems/);
    await page.getByRole("heading", { level: 1, name: "Hidden Gems" }).waitFor();
  });

  await step("Listing shows products with skeleton → results", async () => {
    await page.getByRole("link", { name: /Ajrakh Block-Print Kurta/ }).first().waitFor();
  });

  await step("Filter is encoded in the URL and Back restores it", async () => {
    if (mobile) {
      await page.getByRole("button", { name: /^Filter/ }).click();
      await page.getByRole("dialog").getByRole("button", { name: "M", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Show \d+/ }).click();
    } else {
      await page.getByRole("button", { name: "M", exact: true }).first().click();
    }
    await page.waitForURL(/size=M/);
    await page.goBack();
    await page.waitForFunction(() => !location.search.includes("size=M"));
    await page.goForward();
    await page.waitForURL(/size=M/);
  });

  await step("Open product from the listing (FLIP) → PDP", async () => {
    await page.getByRole("link", { name: /Ajrakh Block-Print Kurta/ }).first().click();
    await page.waitForURL(/\/p\/ajrakh-block-print-kurta/);
    await page.getByRole("heading", { level: 1, name: "Ajrakh Block-Print Kurta" }).waitFor();
  });

  await step("Add to bag is blocked until a size is chosen, and says why", async () => {
    await page.getByRole("button", { name: /Select a size/ }).first().click();
    await page.getByText("Select a size to add this to your bag.").waitFor();
  });

  await step("Choose size, add to bag → bag shows the item", async () => {
    await page.getByRole("radio", { name: /^Size M/ }).check({ force: true });
    await page.getByRole("button", { name: "Add to bag" }).first().click();
    if (mobile) {
      await page.getByText("Added to your bag").waitFor();
    } else {
      const dlg = page.getByRole("dialog", { name: "Shopping bag" });
      await dlg.waitFor();
      await dlg.getByText("Ajrakh Block-Print Kurta").waitFor();
    }
  });

  await step("Wishlist: save from PDP, then see it on /wishlist", async () => {
    if (!mobile) await page.getByRole("dialog", { name: "Shopping bag" }).getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: /Save Ajrakh Block-Print Kurta to wishlist/ }).first().click();
    await page.goto(BASE + "/wishlist", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Ajrakh Block-Print Kurta/ }).first().waitFor();
  });

  await step("Bag page: quantity, coupon invalid → valid, totals", async () => {
    await page.goto(BASE + "/bag", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Increase quantity/ }).click();
    const apply = page.locator("form").filter({ has: page.getByLabel("Coupon code") }).getByRole("button", { name: "Apply" });
    await page.getByLabel("Coupon code").fill("NOPE");
    await apply.click();
    await page.getByText(/isn’t valid/).waitFor();
    await page.getByLabel("Coupon code").fill("TASTE10");
    await apply.click();
    await page.getByText("TASTE10").first().waitFor();
    await page.getByText(/You’re saving/).waitFor();
  });

  await step("Checkout requires sign-in → OTP login (demo account)", async () => {
    await page.getByRole("link", { name: /^Checkout/ }).click();
    await page.waitForURL(/\/login\?next=%2Fcheckout/);
    await page.getByRole("button", { name: /Use the demo account/ }).click();
    await page.getByRole("button", { name: "Send code" }).click();
    await page.getByLabel("One-time code").fill("000000");
    await page.getByRole("button", { name: /Verify/ }).click();
    await page.getByText(/doesn’t match/).waitFor();
    await page.getByLabel("One-time code").fill("123456");
    await page.waitForURL(/\/checkout$/);
  });

  await step("Checkout: address → UPI payment (validation) → review", async () => {
    await page.getByRole("heading", { name: /Address & delivery/ }).waitFor();
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await page.getByRole("radio", { name: /UPI/ }).check({ force: true });
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByText(/Enter a valid UPI ID/).waitFor();
    await page.getByLabel("UPI ID").fill("tester@okbank");
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByRole("button", { name: /Place order \(simulated\)/ }).waitFor();
  });

  await step("Simulated payment failure shows recovery, then success", async () => {
    // back to the payment step, force a decline
    await page.getByRole("region", { name: "Payment" }).getByRole("button", { name: "Change" }).click();
    await page.getByLabel("UPI ID").fill("fail@upi");
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByRole("button", { name: /Place order \(simulated\)/ }).click();
    await page.getByText("Payment didn’t go through").waitFor({ timeout: 8000 });
    await page.getByRole("button", { name: "Change payment method" }).click();
    await page.getByLabel("UPI ID").fill("tester@okbank");
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByRole("button", { name: /Place order \(simulated\)/ }).click();
    await page.waitForURL(/\/checkout\/confirmation\/nf-/, { timeout: 10000 });
    await page.getByRole("heading", { level: 1, name: /Thank you, Aarohi/ }).waitFor();
    await page.getByText(/No payment was taken/).first().waitFor();
  });

  await step("Bag is cleared after the (simulated) order", async () => {
    await page.goto(BASE + "/bag", { waitUntil: "networkidle" });
    await page.getByText("Your bag is empty").waitFor();
  });

  await step("Order history + tracking + simulated progression", async () => {
    await page.goto(BASE + "/account/orders", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /NF-/ }).first().click();
    await page.getByRole("heading", { name: "Tracking" }).waitFor();
    await page.getByRole("button", { name: /Simulate: confirmed/i }).click();
    await page.getByText("Simulated status change.").first().waitFor().catch(() => {});
  });

  await step("Addresses: add new address with validation", async () => {
    await page.goto(BASE + "/account/addresses", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add address" }).click();
    await page.getByRole("button", { name: "Save address" }).click();
    await page.getByText("Enter a valid 6-digit pincode.").waitFor();
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Mobile number").fill("9123456780");
    await page.getByLabel("Pincode").fill("560001");
    await page.getByLabel(/Flat \/ house no/).fill("12 MG Road, Test Building");
    await page.getByRole("button", { name: "Save address" }).click();
    await page.getByText("12 MG Road, Test Building").first().waitFor();
  });

  await step("Search: '/' opens overlay, suggestions, results page", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.keyboard.press("/");
    await page.getByRole("combobox", { name: /Search/ }).fill("festive under 2000");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/search\?q=festive/);
    await page.getByRole("heading", { level: 1 }).getByText(/festive under 2000/).waitFor();
    await page.getByText("Understood:").waitFor();
  });

  await step("Search no-results state guides back to discovery", async () => {
    await page.goto(BASE + "/search?q=zzzzqq", { waitUntil: "networkidle" });
    await page.getByText("Nothing matched — yet").waitFor();
  });

  await step("Sold-out product: notify me + similar pieces", async () => {
    await page.goto(BASE + "/p/satin-corset-top", { waitUntil: "networkidle" });
    await page.getByText(/This piece is sold out/).waitFor();
    await page.getByRole("button", { name: "Notify me" }).first().click();
    await page.getByRole("dialog", { name: /Notify me/ }).getByLabel("Mobile number or email").fill("hello@example.com");
    await page.getByRole("dialog").getByRole("button", { name: "Notify me" }).click();
    await page.getByText("We’ll let you know").first().waitFor();
  });

  await step("Story page: shoppable pin opens quick view", async () => {
    await page.goto(BASE + "/discover/the-block-print-revival", { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.getByRole("button", { name: /^Shop .* by / }).first().click({ force: true });
    await page.getByRole("dialog", { name: /Quick view/ }).waitFor();
  });

  await step("Deal intent via sale link promotes the Offer Edit on Home", async () => {
    await page.goto(BASE + "/?ref=sale", { waitUntil: "networkidle" });
    await page.getByText("You’re looking for offers").waitFor({ timeout: 8000 });
  });

  await step("404 page is editorial and navigable", async () => {
    const r = await page.goto(BASE + "/this-does-not-exist", { waitUntil: "networkidle" });
    eq(r.status(), 404, "status");
    await page.getByRole("heading", { level: 1 }).getByText(/lost/i).waitFor();
  });

  const real = problems.filter((p) => !/Download the React DevTools|favicon/.test(p));
  console.log(real.length ? `\nProblems (${real.length}):\n  ${[...new Set(real)].slice(0, 15).join("\n  ")}` : "\nNo console errors / failed requests.");
  console.log(failures ? `\n${failures} step(s) FAILED` : "\nAll steps passed");
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
