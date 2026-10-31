// Renders the link-preview image (1200×630) that appears when the site's URL is shared: public/brand/og.jpg.
// Flat, like the site: warm paper, the supplied wordmark and one of the two supplied photographs. Re-run after changing the design:
//   NODE_PATH=<global node_modules> node scripts/og-image.cjs
const { chromium } = require("playwright");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const fs = require("node:fs");
// the page is built from a string (about:blank), where file:// URLs are blocked — inline everything as data URIs
const data = (p, mime) => `data:${mime};base64,${fs.readFileSync(path.join(root, p)).toString("base64")}`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:"Inter Display";font-weight:100 900;src:url("${data("public/fonts/inter-latin.woff2", "font/woff2")}") format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;display:grid;grid-template-columns:660px 540px;background:#f4efe8;color:#15120f;font-family:"Inter Display",sans-serif;font-variation-settings:"opsz" 32;-webkit-font-smoothing:antialiased}
.l{padding:56px 56px 52px;display:flex;flex-direction:column;justify-content:space-between}
.logo{height:38px;width:auto;display:block;align-self:flex-start}
.eyebrow{font-size:15px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#675f55;margin-bottom:22px}
h1{font-size:84px;line-height:.96;letter-spacing:-.055em;font-weight:500}
h1 em{font-style:normal;color:#982854}
.sub{margin-top:26px;font-size:21px;line-height:1.4;color:#403a33;max-width:520px}
.r{position:relative;overflow:hidden;background:#d9c3ae}
.r img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%}
</style>
<div class="l">
  <img class="logo" src="${data("public/brand/nykaa-fashion-logo.svg", "image/svg+xml")}" alt="">
  <div>
    <p class="eyebrow">Design prototype</p>
    <h1>An improved <em>Nykaa Fashion.</em></h1>
    <p class="sub">Editorial layouts, a strict grid and motion that stays out of the way. Sample data — nothing is sold.</p>
  </div>
</div>
<div class="r"><img src="${data("public/img/placeholders/kurta-set-4x5.webp", "image/webp")}" alt=""></div>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(root, "public/brand/og.jpg"), type: "jpeg", quality: 88 });
  await browser.close();
  console.log("wrote public/brand/og.jpg");
})();
