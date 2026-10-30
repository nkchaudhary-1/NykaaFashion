// Lab Web Vitals on a running (production) server: LCP, CLS, long-task time and transfer weight per route.
//   node scripts/qa/vitals.cjs [baseUrl] [--route /,/c/women/dresses] [--throttle]
// --throttle emulates a mid-range phone on slow 4G (4x CPU, 1.6 Mbps / 150 ms) for the mobile pass.
// Lab numbers from a shared sandbox: use them to compare builds, not as field data.
const { chromium } = require("playwright");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const ri = process.argv.indexOf("--route");
const ROUTES = ri > -1 ? process.argv[ri + 1].split(",") : ["/", "/c/women/dresses", "/p/poppy-smocked-midi-dress", "/edits/hidden-gems", "/discover/the-block-print-revival", "/search?q=kurta", "/bag"];
const THROTTLE = process.argv.includes("--throttle");

const observe = () => {
  window.__v = { lcp: 0, lcpEl: "", cls: 0, longMs: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__v.lcp = Math.round(e.startTime); window.__v.lcpEl = e.element ? `${e.element.tagName.toLowerCase()}${e.url ? " " + e.url.split("/").pop().slice(0, 40) : ""}` : ""; } }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.longMs += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
};

(async () => {
  const browser = await chromium.launch();
  for (const [label, vw, vh, mobile] of [["mobile", 390, 844, true], ["desktop", 1440, 900, false]]) {
    for (const route of ROUTES) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      if (THROTTLE && mobile) {
        const cdp = await ctx.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      }
      await page.addInitScript(observe);
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => {
        const e = performance.getEntriesByType("resource");
        const kb = (f) => Math.round(e.filter(f).reduce((a, x) => a + (x.transferSize || 0), 0) / 1024);
        return { ...window.__v, cls: +window.__v.cls.toFixed(3), longMs: Math.round(window.__v.longMs), js: kb((x) => x.name.endsWith(".js")), img: kb((x) => /\/_next\/image|\/img\//.test(x.name)) };
      });
      console.log(`${label.padEnd(8)} ${route.padEnd(36)} LCP ${String(r.lcp).padStart(5)}ms  CLS ${r.cls}  long-task ${String(r.longMs).padStart(4)}ms  JS ${String(r.js).padStart(3)}KB  img ${String(r.img).padStart(4)}KB  [${r.lcpEl}]`);
      await ctx.close();
    }
  }
  await browser.close();
})();
