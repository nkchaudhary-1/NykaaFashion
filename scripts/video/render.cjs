// Renders the launch video's scenes (scripts/video/stage) frame by frame in headless Chrome and encodes each scene to an MP4 with ffmpeg.
// A scene is a pure function of time, so frames are independent: scenes render in parallel, and any frame can be looked at on its own (--stills).
//   node scripts/video/render.cjs --shots <dir> --out <dir> [--scenes s1,s2] [--workers 3] [--fps 30]
//   node scripts/video/render.cjs --shots <dir> --out <dir> --scenes s1 --stills 0.5,2,4      PNG stills at those seconds → <out>/stills (no encoding)
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const flag = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, "../..");
const SHOTS = path.resolve(flag("--shots", path.join(__dirname, "out", "shots")));
const OUT = path.resolve(flag("--out", path.join(__dirname, "out")));
const FPS = Number(flag("--fps", "30"));
const WORKERS = Number(flag("--workers", "3"));
const ONLY = flag("--scenes", "") ? flag("--scenes", "").split(",") : null;
const STILLS = flag("--stills", "") ? flag("--stills", "").split(",").map(Number) : null;
const RANGE = flag("--range", "") ? flag("--range", "").split("-").map(Number) : null; // seconds, for a quick look at part of a scene

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp" };
function serve() {
  const roots = { "/stage/": path.join(__dirname, "stage"), "/shots/": SHOTS, "/public/": path.join(ROOT, "public") };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const prefix = Object.keys(roots).find((p) => url.startsWith(p));
    if (!prefix) { res.writeHead(404); res.end(); return; }
    const file = path.join(roots[prefix], url.slice(prefix.length));
    if (!file.startsWith(roots[prefix]) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, port: server.address().port })));
}

async function openStage(browser, port) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("   page error:", String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && console.log("   console:", m.text().slice(0, 200)));
  await page.goto(`http://127.0.0.1:${port}/stage/stage.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  return { ctx, page };
}

async function renderScene(port, scene) {
  const t0 = Date.now();
  const browser = await chromium.launch();
  const { page } = await openStage(browser, port);
  await page.evaluate((id) => window.__prepare(id), scene.id);
  const frames = Math.round(scene.duration * FPS);
  const from = RANGE ? Math.round(RANGE[0] * FPS) : 0;
  const to = RANGE ? Math.min(frames, Math.round(RANGE[1] * FPS)) : frames;

  if (STILLS) {
    fs.mkdirSync(path.join(OUT, "stills"), { recursive: true });
    for (const t of STILLS) {
      await page.evaluate(([id, tt]) => window.__render(id, tt), [scene.id, t]);
      await page.screenshot({ path: path.join(OUT, "stills", `${scene.id}_${String(t).replace(".", "p")}.png`) });
    }
    await browser.close();
    return;
  }

  fs.mkdirSync(path.join(OUT, "scenes"), { recursive: true });
  const file = path.join(OUT, "scenes", `${scene.id}${RANGE ? `_${RANGE[0]}-${RANGE[1]}` : ""}.mp4`);
  // Chrome's JPEG frames are BT.601, full range. They are converted to the HD standard (BT.709, limited range) and tagged as such, so a player that assumes
  // BT.709 for HD — as most do — shows the site's colours (the pinks, the cream) instead of shifted ones. Checked on flat swatches: within 2 of 255 levels.
  const colour = "scale=in_range=full:in_color_matrix=bt601:out_range=limited:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p";
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-vf", colour, "-c:v", "libx264", "-preset", "veryfast", "-crf", "11", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-r", String(FPS), "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const closed = new Promise((res, rej) => { ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))); ff.on("error", rej); });
  for (let f = from; f < to; f++) {
    await page.evaluate(([id, t]) => window.__render(id, t), [scene.id, f / FPS]);
    const buf = await page.screenshot({ type: "jpeg", quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await closed;
  await browser.close();
  console.log(`  ${scene.id}: ${to - from} frames → ${path.relative(ROOT, file)} in ${Math.round((Date.now() - t0) / 1000)} s`);
}

(async () => {
  const { server, port } = await serve();
  const browser = await chromium.launch();
  const { page } = await openStage(browser, port);
  let scenes = await page.evaluate(() => window.__scenes);
  await browser.close();
  // the running order and lengths of every scene, whichever of them this call renders: build.sh joins the clips and cuts the music from it
  if (!STILLS && !RANGE) {
    fs.mkdirSync(path.join(OUT, "scenes"), { recursive: true });
    fs.writeFileSync(path.join(OUT, "scenes", "index.json"), JSON.stringify(scenes.map((s) => ({ id: s.id, duration: s.duration })), null, 1));
  }
  if (ONLY) scenes = scenes.filter((s) => ONLY.includes(s.id));
  console.log(`${scenes.length} scene(s), ${scenes.reduce((n, s) => n + s.duration, 0).toFixed(1)} s${STILLS ? " — stills" : ""}`);
  const queue = [...scenes];
  const run = async () => { for (let s = queue.shift(); s; s = queue.shift()) await renderScene(port, s); };
  await Promise.all(Array.from({ length: Math.min(WORKERS, scenes.length) }, run));
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
