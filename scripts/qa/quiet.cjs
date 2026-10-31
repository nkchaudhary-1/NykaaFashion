// Keeps the pop-up (PiP) out of QA runs that are about something else. A visit that has already shown its two campaigns shows no more
// (MAX_PER_VISIT in src/lib/promo.ts), so every context this opens starts as such a visit. `?promo=<id>` still forces one on purpose.
// promo.cjs is the only script that wants the pop-up to behave normally.
//   const browser = require("./quiet.cjs")(await chromium.launch());
// NF_LAYOUT=bleed|classic also opens every context with that home layout chosen (as the Prototype panel's switch would), so any script can run against either layout:
//   NF_LAYOUT=bleed node scripts/qa/overflow.cjs http://localhost:3100
const LAYOUT = process.env.NF_LAYOUT === "bleed" || process.env.NF_LAYOUT === "classic" ? process.env.NF_LAYOUT : null;
const PREFS = `try { if (!localStorage.getItem("nf.prefs")) localStorage.setItem("nf.prefs", JSON.stringify({ v: 1, d: { announceDismissed: false, slowNetwork: false, failNext: false, failModule: null, homeLayout: ${JSON.stringify(LAYOUT)}, recentSearches: [], savedStories: [], notify: [], newsletter: null, reviews: [], helpful: [], messages: [] } })); } catch (e) {}`;
const SCRIPT = `try { sessionStorage.setItem("nf.promo.visit", JSON.stringify({ v: 1, d: { shown: ["qa-quiet-1", "qa-quiet-2"] } })); } catch (e) {}`;
module.exports = function quiet(browser) {
  const open = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const ctx = await open(...args);
    await ctx.addInitScript(SCRIPT);
    if (LAYOUT) await ctx.addInitScript(PREFS);
    return ctx;
  };
  return browser;
};
module.exports.SCRIPT = SCRIPT;
