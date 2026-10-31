// Keeps the pop-up (PiP) out of QA runs that are about something else. A visit that has already shown its two campaigns shows no more
// (MAX_PER_VISIT in src/lib/promo.ts), so every context this opens starts as such a visit. `?promo=<id>` still forces one on purpose.
// promo.cjs is the only script that wants the pop-up to behave normally.
//   const browser = require("./quiet.cjs")(await chromium.launch());
const SCRIPT = `try { sessionStorage.setItem("nf.promo.visit", JSON.stringify({ v: 1, d: { shown: ["qa-quiet-1", "qa-quiet-2"] } })); } catch (e) {}`;
module.exports = function quiet(browser) {
  const open = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const ctx = await open(...args);
    await ctx.addInitScript(SCRIPT);
    return ctx;
  };
  return browser;
};
module.exports.SCRIPT = SCRIPT;
