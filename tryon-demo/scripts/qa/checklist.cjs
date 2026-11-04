#!/usr/bin/env node
/* eslint-disable */
// The PRD's test checklist, executed in headless Chromium with a FAKE camera device.
//
//   node scripts/qa/checklist.cjs <url> [--out qa-output] [--person photo.jpg] [--photo <url built with TRYON_PHOTO_URL>]
//
//   <url>      a running build of the demo (the on-device preview; no vendor, no key)
//   --photo    a second running build started with TRYON_PHOTO_URL pointing at `python server/tryon_server.py --mock`
//
// Needs Playwright (preinstalled in the cloud sandbox; elsewhere: npm i --no-save playwright && npx playwright install chromium).
// axe-core is optional: npm i --no-save axe-core. The on-device tracker checks (T*) need ffmpeg, to turn a photo of a
// person into the clip Chromium's fake camera plays; --person supplies the photo, otherwise MediaPipe's public pose
// test image is downloaded into the output folder.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? args.splice(outIdx, 2)[1] : "qa-output";
const personIdx = args.indexOf("--person");
const PERSON = personIdx >= 0 ? args.splice(personIdx, 2)[1] : null;
const photoIdx = args.indexOf("--photo");
const PHOTO = photoIdx >= 0 ? args.splice(photoIdx, 2)[1] : null; // a sim build whose TRYON_PHOTO_URL points at `python server/tryon_server.py --mock`
const [SIM] = args;
if (!SIM) {
  console.error("usage: node scripts/qa/checklist.cjs <url> [--out dir] [--person photo.jpg] [--photo <url>]");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

let axeSource = null;
try {
  axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
} catch {}

// ── harness ──────────────────────────────────────────────────────────────────
const results = [];
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
// Every browser this run launches, so a failed check can never leak its context: a leaked live page keeps the
// tracker (MediaPipe under software GL) burning CPU and cascades into timeouts in every later check.
const BROWSERS = new Set();
const launch = async (opts) => {
  const b = await chromium.launch(opts);
  BROWSERS.add(b);
  return b;
};
const closeLeftovers = async () => {
  for (const b of BROWSERS) if (b.isConnected()) for (const c of b.contexts()) await c.close().catch(() => {});
};
const check = async (id, title, fn) => {
  if (ONLY && !ONLY.includes(id)) return;
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ id, title, ok: true, detail: detail || "", ms: Date.now() - t0 });
    console.log(`  ✓ ${id}  ${title}${detail ? `  — ${detail}` : ""}`);
  } catch (e) {
    results.push({ id, title, ok: false, detail: String(e.message || e).split("\n")[0], ms: Date.now() - t0 });
    console.log(`  ✗ ${id}  ${title}\n      ${String(e.message || e).split("\n")[0]}`);
  } finally {
    await closeLeftovers();
  }
};
// QA_TRACE=1 prints step markers, to find where a check stalls.
const T0 = Date.now();
const trace = (...a) => process.env.QA_TRACE && console.log("      ·", String(Date.now() - T0).padStart(6), ...a);
const section = (t) => console.log(`\n${t}`);
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const eq = (a, b, msg) => assert(a === b, `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// Runs in every page: wraps getUserMedia (count calls, remember streams, inject failures/delays), captures the
// app's [tryon] analytics events, and can delay the simulation's hidden <video> to hold the "connecting" state.
const INIT = () => {
  const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const g = (window.__gum = { calls: 0, streams: [], failWith: null, delayMs: 0, lastConstraints: null });
  navigator.mediaDevices.getUserMedia = async (c) => {
    g.calls++;
    g.lastConstraints = c;
    if (g.delayMs) await new Promise((r) => setTimeout(r, g.delayMs));
    if (g.failWith) throw Object.assign(new Error(g.failWith.message), { name: g.failWith.name });
    const s = await real(c);
    g.streams.push(s);
    return s;
  };
  g.live = () => g.streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === "live").length;
  g.endExternally = () => g.streams[g.streams.length - 1].getVideoTracks()[0].dispatchEvent(new Event("ended"));
  // Every request the page makes, seen from inside the page: the privacy claim is that none leaves this origin.
  window.__requests = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__requests.push(e.name);
    }).observe({ type: "resource", buffered: true });
  } catch {}
  const realFetch = window.fetch.bind(window);
  window.fetch = async (...a) => {
    try {
      window.__requests.push(String(a[0] && a[0].url ? a[0].url : a[0]));
    } catch {}
    return realFetch(...a);
  };
  // Every data-state the panel passes through, in order — transient states (switching) are too short to poll for
  // when MediaPipe is hogging the main thread under software GL.
  window.__states = [];
  new MutationObserver((muts) => {
    for (const m of muts) {
      const el = m.target;
      if (el.getAttribute && el.getAttribute("data-testid") === "tryon-panel") {
        const st = el.getAttribute("data-state");
        if (window.__states[window.__states.length - 1] !== st) window.__states.push(st);
      }
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-state"] }); // `document` exists at init-script time; documentElement does not yet
  window.__events = [];
  const dbg = console.debug.bind(console);
  console.debug = (...a) => {
    if (a[0] === "[tryon]") {
      try {
        window.__events.push(JSON.parse(a[1]));
      } catch {}
    }
    dbg(...a);
  };
  window.__sim = { playDelay: 0 };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = async function () {
    if (window.__sim.playDelay && this.getAttribute("aria-hidden") === "true") {
      await new Promise((r) => setTimeout(r, window.__sim.playDelay));
    }
    return play.call(this);
  };
};

const PANEL = '[data-testid="tryon-panel"]';
const state = (page) => page.locator(PANEL).getAttribute("data-state", { timeout: 20000 }).catch(() => "(no panel)");
/** Wait until the panel has PASSED THROUGH state `s` at some point (transient states included). */
const waitSeen = (page, s, timeout = 30000) =>
  page.waitForFunction((s) => window.__states.includes(s), s, { timeout }).catch(async () => {
    throw new Error(`state "${s}" never seen (states: ${JSON.stringify(await page.evaluate(() => window.__states))})`);
  });
const clearSeen = (page) => page.evaluate(() => (window.__states = []));
const waitState = (page, s, timeout = 30000) =>
  page.waitForSelector(`${PANEL}[data-state="${s}"]`, { timeout }).catch(async () => {
    const url = page.url();
    const text = await page.locator("body").innerText({ timeout: 2000 }).then((t) => t.replace(/\s+/g, " ").slice(0, 160)).catch(() => "(no body)");
    throw new Error(`never reached state "${s}" (stuck in "${await state(page)}") at ${url} :: ${text}`);
  });
const gum = (page) => page.evaluate(() => ({ calls: window.__gum.calls, live: window.__gum.live(), streams: window.__gum.streams.length }));
const events = (page) => page.evaluate(() => window.__events);
const names = async (page) => (await events(page)).map((e) => e.name);
const noOverflow = (page) =>
  page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })).then(({ sw, iw }) => assert(sw <= iw, `horizontal overflow: scrollWidth ${sw} > ${iw}`));
// Tapping Try on smooth-scrolls the panel into view (instant under reduced motion). Measure after it settles.
async function settleScroll(page) {
  let last = -1;
  for (let i = 0; i < 30; i++) {
    const y = await page.evaluate(() => Math.round(scrollY));
    if (y === last) return;
    last = y;
    await page.waitForTimeout(120);
  }
}
// Let the 200-240ms state animations finish so screenshots show the settled state, not a mid-fade frame.
const shot = async (page, name) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
};

async function open(browser, url, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 860 },
    deviceScaleFactor: opts.dsf || 1,
    hasTouch: !!opts.touch,
    isMobile: !!opts.touch,
    reducedMotion: opts.reducedMotion,
    permissions: ["camera"],
  });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.__errors = errors;
  await page.goto(url, { waitUntil: "networkidle" });
  return page;
}
const tryOn = (page, id) => page.click(`[data-testid="tryon-${id}"]`);
const agree = (page) => page.getByRole("button", { name: "Agree & continue" }).click();
async function goLive(page, id = "field-bomber") {
  await tryOn(page, id);
  await waitState(page, "consent");
  await agree(page);
  await waitState(page, "live");
}
const appliedName = (page) => page.textContent('[data-testid="applied-name"]').then((t) => t.split("·")[0].trim());

async function axeRun(page, label) {
  if (!axeSource) return null;
  await page.evaluate(axeSource);
  const r = await page.evaluate(() =>
    axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }),
  );
  return r.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.help}`);
}

(async () => {
  const browser = await launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });

  // ════════════════════════════════════════════════════════════════════════════
  section(`SIMULATION BUILD  ${SIM}`);

  await check("S1", "Page loads idle with no camera access and a visible Simulation badge", async () => {
    const page = await open(browser, SIM);
    eq(await state(page), "idle", "state");
    eq((await gum(page)).calls, 0, "getUserMedia calls at load");
    assert(await page.locator('[data-testid="sim-badge"]').isVisible(), "Simulation badge not visible");
    eq(await page.locator("video").count(), 0, "video elements at load");
    assert((await page.locator('[data-testid="tryon-panel"]').getAttribute("data-mode")) === "sim", "panel not in sim mode");
    eq(await page.locator('[data-testid="photo-button"]').count(), 0, "photo button shown with no render server configured");
    await shot(page, "01-desktop-idle");
    assert(page.__errors.length === 0, `console errors: ${page.__errors.join(" | ")}`);
    await page.context().close();
  });

  await check("S2", "Consent gate: Try on shows consent and opens NO camera; Not now returns to idle, still no camera", async () => {
    const page = await open(browser, SIM);
    await tryOn(page, "field-bomber");
    await waitState(page, "consent");
    eq((await gum(page)).calls, 0, "camera opened before agreeing");
    const text = await page.textContent(PANEL);
    assert(text.includes("We'll use your camera to show the look on you."), "consent title missing");
    assert(text.includes("stays in this browser tab"), "sim consent must say video stays in the tab (and only because that is true)");
    assert(!/sent to/.test(text), "consent must not say video is sent anywhere: it isn't");
    assert(await page.evaluate(() => document.activeElement?.hasAttribute("data-autofocus")), "focus did not move to the consent heading");
    await shot(page, "02-desktop-consent");
    await page.getByRole("button", { name: "Not now" }).click();
    await waitState(page, "idle");
    eq((await gum(page)).calls, 0, "camera opened after declining");
    const n = await names(page);
    assert(n.includes("consent_shown") && n.includes("consent_declined"), `events: ${n}`);
    await page.context().close();
  });

  await check("S3", "Agree -> camera -> live; camera indicator and Simulation badge both visible", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    eq((await gum(page)).calls, 1, "getUserMedia calls");
    assert(await page.locator('[data-testid="camera-indicator"]').isVisible(), "camera-on indicator missing while live");
    assert(await page.locator('[data-testid="sim-badge"]').isVisible(), "Simulation badge missing while live");
    eq(await appliedName(page), "Field Bomber", "applied garment");
    eq((await page.textContent('[data-testid="readout"]')).includes("isn't measured in simulation"), true, "sim readout must not invent latency");
    await shot(page, "03-desktop-live");
    const c = await page.evaluate(() => window.__gum.lastConstraints.video);
    eq(c.facingMode, "user", "facingMode");
    const n = await names(page);
    for (const e of ["tryon_clicked", "consent_shown", "consent_agreed", "permission_granted", "session_live"]) assert(n.includes(e), `missing event ${e} in ${n}`);
    await page.context().close();
  });

  await check("S4", "Switch garment while live: updates in place, camera does NOT restart", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    const before = await gum(page);
    await clearSeen(page);
    await page.click('[data-testid="tray-zigzag-knit"]');
    await waitSeen(page, "switching");
    // One synchronous DOM read: the swap can finish between two round trips, so the mid-swap labels must come
    // from the same frame as the state they describe.
    const mid = await page.evaluate(() => {
      const t = (sel) => ((document.querySelector(sel) || {}).textContent || "").trim();
      const panel = document.querySelector('[data-testid="tryon-panel"]');
      return { state: panel && panel.getAttribute("data-state"), target: t('[data-testid="pill-zigzag-knit"]'), old: t('[data-testid="pill-field-bomber"]'), text: panel ? panel.textContent : "" };
    });
    if (mid.state === "switching") {
      // honest card labels mid-swap: the new choice is "Selected", the old one is still what is on screen
      eq(mid.target, "Selected", "target pill during swap");
      eq(mid.old, "On you", "old pill during swap");
      assert(mid.text.includes("Switching to Zigzag Knit…"), "switching copy missing");
      await shot(page, "04-desktop-switching");
    }
    await waitState(page, "live");
    eq(await appliedName(page), "Zigzag Knit", "applied garment");
    const after = await gum(page);
    eq(after.calls, before.calls, "getUserMedia calls (camera restarted?)");
    eq(after.live, before.live, "live camera tracks");
    eq(after.streams, before.streams, "camera streams");
    eq((await page.textContent('[data-testid="pill-zigzag-knit"]')).trim(), "On you", "target pill after swap");
    await page.context().close();
  });

  await check("S5", "Rapid switching x4 in one frame: last selection wins, no restart", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.evaluate(() => {
      for (const id of ["oxford-stripe", "cloud-knit", "field-bomber", "zigzag-knit"]) document.querySelector(`[data-testid="tray-${id}"]`).click();
    });
    await waitState(page, "live");
    await page.waitForTimeout(300);
    eq(await state(page), "live", "settled state");
    eq(await appliedName(page), "Zigzag Knit", "last selection");
    eq((await gum(page)).calls, 1, "getUserMedia calls");
    const sw = (await events(page)).filter((e) => e.name === "garment_switched");
    eq(sw[sw.length - 1].garmentId, "zigzag-knit", "last garment_switched event");
    await page.context().close();
  });

  await check("S6", "Second Try on of another garment from the CARD while live is a switch, not a new session", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await clearSeen(page);
    await tryOn(page, "cloud-knit");
    await waitSeen(page, "switching");
    await waitState(page, "live");
    eq(await appliedName(page), "Cloud Knit", "applied garment");
    eq((await gum(page)).calls, 1, "getUserMedia calls");
    eq(await page.locator('[data-testid="camera-indicator"]').count(), 1, "one camera indicator");
    await page.context().close();
  });

  await check("S7", "Close: camera off, tracks stopped, no leftover media elements, panel back to idle", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    eq((await gum(page)).live > 0, true, "precondition: a live camera track");
    await page.click('[data-testid="close"]');
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "live camera tracks after Close");
    eq(await page.locator('[data-testid="camera-indicator"]').count(), 0, "camera indicator after Close");
    eq(await page.locator("video").count(), 0, "leftover <video> elements after Close");
    const closed = (await events(page)).find((e) => e.name === "session_closed");
    assert(closed && closed.reason === "user" && closed.durationMs > 0, `session_closed event: ${JSON.stringify(closed)}`);
    assert(await page.evaluate(() => document.activeElement?.hasAttribute("data-autofocus")), "focus not returned to the idle heading");
    await page.context().close();
  });

  await check("S8", "Fullscreen: enter, Esc exits (stays live); Close from fullscreen leaves fullscreen AND stops tracks", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.getByRole("button", { name: "Enter fullscreen" }).click();
    await page.waitForSelector(`${PANEL}[data-fullscreen="true"]`);
    eq(await page.$eval(PANEL, (el) => getComputedStyle(el).position), "fixed", "fullscreen overlay position");
    await noOverflow(page);
    await shot(page, "05-desktop-fullscreen");
    await page.keyboard.press("Escape");
    await page.waitForSelector(`${PANEL}[data-fullscreen="false"]`);
    eq(await state(page), "live", "Esc in fullscreen must only exit fullscreen");
    await page.getByRole("button", { name: "Enter fullscreen" }).click();
    await page.waitForSelector(`${PANEL}[data-fullscreen="true"]`);
    await page.click('[data-testid="close"]');
    await waitState(page, "idle");
    // exitFullscreen() is asynchronous: the state flips to idle first, the document follows a frame or two later
    await page.waitForSelector(`${PANEL}[data-fullscreen="false"]`, { timeout: 5000 }).catch(() => assert(false, "data-fullscreen still true after Close"));
    await page.waitForFunction(() => document.fullscreenElement === null, null, { timeout: 5000 }).catch(() => assert(false, "document.fullscreenElement still set after Close"));
    eq((await gum(page)).live, 0, "live tracks after Close from fullscreen");
    eq(await page.evaluate(() => document.documentElement.style.overflow), "", "page scroll lock released");
    await page.context().close();
  });

  await check("S9", "Tab close / page hide runs the same teardown as Close", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "live tracks after pagehide");
    await page.context().close();
  });

  await check("S10", "Permission DENIED -> denied state with how-to-enable + Retry; Retry then works", async () => {
    const page = await open(browser, SIM);
    await page.evaluate(() => (window.__gum.failWith = { name: "NotAllowedError", message: "Permission denied" }));
    await tryOn(page, "field-bomber");
    await waitState(page, "consent");
    await agree(page);
    await waitState(page, "permission-denied");
    const text = await page.textContent(PANEL);
    assert(text.includes("Camera's blocked.") && text.includes("address-bar settings"), "denied copy missing");
    await shot(page, "06-desktop-denied");
    await page.evaluate(() => (window.__gum.failWith = null));
    await page.getByRole("button", { name: "Retry" }).click();
    await waitState(page, "live");
    await page.context().close();
  });

  await check("S11", "Permission DISMISSED (not denied) -> recoverable; NO CAMERA -> a message, not a spinner", async () => {
    const page = await open(browser, SIM);
    await page.evaluate(() => (window.__gum.failWith = { name: "NotAllowedError", message: "Permission dismissed" }));
    await tryOn(page, "field-bomber");
    await waitState(page, "consent");
    await agree(page);
    await waitState(page, "permission-denied");
    assert((await page.textContent(PANEL)).includes("Camera access wasn't granted."), "dismissed copy missing");
    await page.evaluate(() => (window.__gum.failWith = null));
    await page.getByRole("button", { name: "Retry" }).click();
    await waitState(page, "live");
    await page.click('[data-testid="close"]');
    await waitState(page, "idle");
    await page.evaluate(() => (window.__gum.failWith = { name: "NotFoundError", message: "Requested device not found" }));
    await tryOn(page, "field-bomber");
    await agree(page);
    await waitState(page, "permission-denied");
    await page.waitForTimeout(1200);
    eq(await state(page), "permission-denied", "state after 1.2s (infinite spinner?)");
    assert((await page.textContent(PANEL)).includes("No camera found."), "no-camera copy missing");
    await page.context().close();
  });

  await check("S12", "Requesting-permission state shows; Close while the prompt is open, then a LATE grant, is switched straight back off", async () => {
    const page = await open(browser, SIM);
    await page.evaluate(() => (window.__gum.delayMs = 1500));
    await tryOn(page, "field-bomber");
    await waitState(page, "consent");
    await agree(page);
    await waitState(page, "requesting-permission");
    assert((await page.textContent(PANEL)).includes("Waiting for your camera permission."), "requesting copy missing");
    await shot(page, "07-desktop-requesting");
    await page.getByRole("button", { name: "Cancel" }).click();
    await waitState(page, "idle");
    await page.waitForTimeout(2200); // the prompt "resolves" after the shopper left
    eq(await state(page), "idle", "state after the late grant");
    eq((await gum(page)).live, 0, "live camera tracks after a late grant");
    await page.context().close();
  });

  await check("S13", "Connecting state is honest (no fake progress), Cancel works, a late connect cannot revive the session", async () => {
    const page = await open(browser, SIM);
    await page.evaluate(() => (window.__sim.playDelay = 2500));
    await tryOn(page, "field-bomber");
    await agree(page);
    await waitState(page, "connecting");
    const text = await page.textContent(PANEL);
    assert(text.includes("Starting your live try-on…"), "connecting copy missing");
    assert(!/\d+\s?%/.test(text) && !/\bseconds?\b/i.test(text.replace(/Camera on/g, "")), "connecting must show no fake progress or promised seconds");
    assert(await page.locator('[data-testid="camera-indicator"]').isVisible(), "camera is on while connecting: the indicator must say so");
    await shot(page, "08-desktop-connecting");
    await page.getByRole("button", { name: "Cancel" }).click();
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "tracks after Cancel");
    await page.waitForTimeout(3000);
    eq(await state(page), "idle", "state after the delayed connect finished");
    eq(await page.locator("video").count(), 0, "leftover <video> after a cancelled connect");
    await page.context().close();
  });

  await check("S14", "Stream drops -> error with camera OFF; Retry reconnects without a page reload", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.evaluate(() => (window.__marker = "same-page"));
    await page.evaluate(() => window.__gum.endExternally());
    await waitState(page, "error");
    const text = await page.textContent(PANEL);
    assert(text.includes("Lost the connection.") && text.includes("Your camera's been turned off."), "error copy missing");
    eq((await gum(page)).live, 0, "camera must really be off when the copy says so");
    await shot(page, "09-desktop-error");
    await page.getByRole("button", { name: "Retry" }).click();
    await waitState(page, "live");
    eq(await page.evaluate(() => window.__marker), "same-page", "page reloaded");
    eq((await gum(page)).calls, 2, "getUserMedia calls");
    await page.context().close();
  });

  await check("S15", "Backgrounded tab tears down (no hidden live camera, no spend) and offers Resume", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitState(page, "error");
    assert((await page.textContent(PANEL)).includes("Paused."), "paused copy missing");
    eq((await gum(page)).live, 0, "camera while backgrounded");
    await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, get: () => false }));
    await page.getByRole("button", { name: "Resume" }).click();
    await waitState(page, "live");
    await page.context().close();
  });

  await check("S16", "Desktop drag-and-drop: drag a card onto the panel -> consent for that garment; dragging while live switches", async () => {
    const page = await open(browser, SIM);
    await page.waitForSelector('[data-testid="card-cloud-knit"][draggable="true"]');
    await page.locator('[data-testid="card-cloud-knit"]').dragTo(page.locator(PANEL));
    await waitState(page, "consent");
    assert((await page.textContent(PANEL)).includes("Trying on Cloud Knit"), "consent is for the dragged garment");
    eq((await gum(page)).calls, 0, "a drop must still go through consent");
    await agree(page);
    await waitState(page, "live");
    await clearSeen(page);
    await page.locator('[data-testid="card-oxford-stripe"]').dragTo(page.locator(PANEL));
    await waitSeen(page, "switching");
    await waitState(page, "live");
    eq(await appliedName(page), "Oxford Stripe Shirt", "applied after drop-switch");
    await page.context().close();
  });

  await check("S17", "Keyboard only: reach Try on, Enter, focus lands on the new state, Agree, Esc closes and stops the camera", async () => {
    const page = await open(browser, SIM);
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") === "tryon-field-bomber");
    }
    assert(reached, "could not Tab to the first Try on");
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    assert(ring.style !== "none" && ring.width >= 2, `focus ring not visible: ${JSON.stringify(ring)}`);
    await page.keyboard.press("Enter");
    await waitState(page, "consent");
    assert(await page.evaluate(() => document.activeElement?.hasAttribute("data-autofocus")), "focus did not move into the panel");
    await page.keyboard.press("Tab");
    eq(await page.evaluate(() => document.activeElement?.textContent), "Agree & continue", "first Tab stop in consent");
    await page.keyboard.press("Enter");
    await waitState(page, "live");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "tracks after Esc");
    await page.context().close();
  });

  await check("S18", "Reduced motion: state changes are instant, nothing is lost", async () => {
    const page = await open(browser, SIM, { reducedMotion: "reduce" });
    await tryOn(page, "field-bomber");
    await waitState(page, "consent");
    const dur = await page.evaluate(() => {
      const el = document.querySelector(".anim-panel-in") || document.querySelector(".anim-fade");
      return el ? parseFloat(getComputedStyle(el).animationDuration) * 1000 : null;
    });
    assert(dur !== null && dur <= 1, `animation duration under reduced motion: ${dur}ms`);
    await agree(page);
    await waitState(page, "live");
    await page.click('[data-testid="tray-cloud-knit"]');
    await waitState(page, "live");
    eq(await appliedName(page), "Cloud Knit", "switch under reduced motion");
    await page.context().close();
  });

  await check("S19", "No horizontal overflow at 360 / 390 / 768 / 1024 / 1280 / 1440 in idle, consent, live and fullscreen", async () => {
    for (const w of [360, 390, 768, 1024, 1280, 1440]) {
      const page = await open(browser, SIM, { viewport: { width: w, height: 800 } });
      await noOverflow(page);
      await tryOn(page, "field-bomber");
      await waitState(page, "consent");
      await noOverflow(page);
      await agree(page);
      await waitState(page, "live");
      await noOverflow(page);
      await page.getByRole("button", { name: "Enter fullscreen" }).click();
      await page.waitForSelector(`${PANEL}[data-fullscreen="true"]`);
      await noOverflow(page);
      await page.context().close();
    }
    return "6 widths";
  });

  await check("S20", "Provider swap is invisible to the component: sim latency is never invented", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await clearSeen(page);
    await page.click('[data-testid="tray-cloud-knit"]');
    await waitSeen(page, "switching");
    await waitState(page, "live");
    const ev = await events(page);
    const live = ev.find((e) => e.name === "session_live");
    const sw = ev.find((e) => e.name === "garment_switched");
    assert(typeof live.ttffMs === "number" && typeof sw.switchMs === "number", "events carry measured numbers");
    assert(ev.every((e) => e.mode === "sim"), "every event is tagged with the mode");
    eq((await page.textContent('[data-testid="readout"]')).match(/\d/), null, "sim readout must contain no latency number");
    return `ttff event ${Math.round(live.ttffMs)}ms, switch event ${Math.round(sw.switchMs)}ms (instrumentation only — not shown in sim)`;
  });

  await check("S21", "Nothing leaves the origin: every request during a whole session (page, models, WASM, images) is same-origin", async () => {
    const page = await open(browser, SIM);
    const origin = new URL(SIM).origin;
    const offOrigin = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/^https?:/.test(u) && !u.startsWith(origin)) offOrigin.push(u);
    });
    await goLive(page);
    await page.click('[data-testid="tray-cloud-knit"]');
    await waitState(page, "live");
    await page.waitForTimeout(800);
    await page.click('[data-testid="close"]');
    await waitState(page, "idle");
    const inPage = (await page.evaluate(() => window.__requests)).filter((u) => /^https?:/.test(u) && !u.startsWith(origin));
    const all = [...new Set([...offOrigin, ...inPage])];
    eq(all.length, 0, `requests to other origins: ${all.slice(0, 5).join(", ")}`);
    await page.context().close();
    return "page, models, WASM and images all from this origin";
  });

  await check("S22", "Touch targets >= 44px on every visible control (desktop layout, idle + live)", async () => {
    const page = await open(browser, SIM);
    const audit = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("button, a[href], [role=button]")]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 1 && r.height > 1)
          .filter(({ r }) => r.width < 43.5 || r.height < 43.5)
          .map(({ el, r }) => `${el.getAttribute("data-testid") || el.getAttribute("aria-label") || el.textContent.slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`),
      );
    let small = await audit();
    assert(small.length === 0, `idle: ${small.join(", ")}`);
    await goLive(page);
    small = await audit();
    assert(small.length === 0, `live: ${small.join(", ")}`);
    await page.context().close();
  });

  // ── axe ──
  if (axeSource) {
    await check("A1", "axe-core (WCAG 2.1 A/AA + best-practice): zero violations across idle, consent, denied, live, error", async () => {
      const page = await open(browser, SIM);
      const found = [];
      const run = async (label) => (await axeRun(page, label)).forEach((v) => found.push(`${label}: ${v}`));
      await run("idle");
      await tryOn(page, "field-bomber");
      await waitState(page, "consent");
      await page.waitForTimeout(350);
      await run("consent");
      await agree(page);
      await waitState(page, "live");
      await page.waitForTimeout(350);
      await run("live");
      await page.evaluate(() => window.__gum.endExternally());
      await waitState(page, "error");
      await page.waitForTimeout(350);
      await run("error");
      await page.getByRole("button", { name: "Close" }).click();
      await page.evaluate(() => (window.__gum.failWith = { name: "NotAllowedError", message: "Permission denied" }));
      await tryOn(page, "field-bomber");
      await agree(page);
      await waitState(page, "permission-denied");
      await page.waitForTimeout(350);
      await run("denied");
      assert(found.length === 0, found.join(" | "));
      await page.context().close();
    });
  } else {
    console.log("  – A1  axe-core not installed (npm i --no-save axe-core) — skipped");
  }

  // ════════════════════════════════════════════════════════════════════════════
  section("MOBILE (360x740, touch, coarse pointer)");
  const touchBrowser = await launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      // Make the browser report a phone's pointer: Playwright's isMobile alone leaves `pointer: fine`.
      "--blink-settings=primaryPointerType=2,primaryHoverType=1,availablePointerTypes=2,availableHoverTypes=1",
    ],
  });

  await check("M1", "Phone: coarse pointer, tap-to-select, front camera (portrait), no drag hint, cards not draggable, no overflow", async () => {
    const page = await open(touchBrowser, SIM, { viewport: { width: 360, height: 740 }, touch: true, dsf: 2 });
    eq(await page.evaluate(() => matchMedia("(pointer: coarse)").matches), true, "emulated pointer: coarse");
    await shot(page, "10-mobile-idle");
    eq(await page.getByText("Or drag a piece").isVisible(), false, "drag hint must be hidden on touch");
    eq(await page.locator('[data-testid="card-field-bomber"]').getAttribute("draggable"), null, "card draggable on touch");
    await noOverflow(page);
    await page.tap('[data-testid="tryon-field-bomber"]');
    await waitState(page, "consent");
    await settleScroll(page);
    await noOverflow(page);
    await shot(page, "11-mobile-consent");
    await page.getByRole("button", { name: "Agree & continue" }).tap();
    await waitState(page, "live");
    await settleScroll(page);
    const v = await page.evaluate(() => window.__gum.lastConstraints.video);
    eq(v.facingMode, "user", "front camera");
    eq(v.height.ideal, 1280, "portrait capture height (720x1280)");
    eq(v.width.ideal, 720, "portrait capture width");
    await noOverflow(page);
    await shot(page, "12-mobile-live");
    // controls reachable: on screen and in the bottom/top thirds a thumb can reach
    const inView = await page.evaluate(() =>
      ["close", "tray-cloud-knit"].map((id) => {
        const r = document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();
        return { id, ok: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, w: r.width, h: r.height, rect: [r.left, r.top, r.right, r.bottom].map(Math.round), scrollY: Math.round(scrollY), vh: innerHeight };
      }),
    );
    for (const c of inView) assert(c.ok && c.w >= 44 && c.h >= 44, `${c.id} not reachable / too small: ${JSON.stringify(c)}`);
    await clearSeen(page);
    await page.tap('[data-testid="tray-cloud-knit"]');
    await waitSeen(page, "switching");
    await waitState(page, "live");
    eq(await appliedName(page), "Cloud Knit", "tap-switch");
    await page.getByRole("button", { name: "Enter fullscreen" }).tap();
    await page.waitForSelector(`${PANEL}[data-fullscreen="true"]`);
    await noOverflow(page);
    await shot(page, "13-mobile-fullscreen");
    // thumbs can still switch from inside fullscreen
    await clearSeen(page);
    await page.tap('[data-testid="tray-oxford-stripe"]');
    await waitSeen(page, "switching");
    await waitState(page, "live");
    eq(await appliedName(page), "Oxford Stripe Shirt", "switch inside fullscreen");
    await page.tap('[data-testid="close"]');
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "tracks after Close from mobile fullscreen");
    await page.context().close();
  });

  await check("M2", "Phone: every visible control is >= 44px, in idle, consent and live", async () => {
    const page = await open(touchBrowser, SIM, { viewport: { width: 360, height: 740 }, touch: true });
    const audit = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("button, a[href], [role=button]")]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 1 && r.height > 1 && (r.width < 43.5 || r.height < 43.5))
          .map(({ el, r }) => `${el.getAttribute("data-testid") || el.getAttribute("aria-label")} ${Math.round(r.width)}x${Math.round(r.height)}`),
      );
    let small = await audit();
    assert(small.length === 0, `idle: ${small.join(", ")}`);
    await page.tap('[data-testid="tryon-field-bomber"]');
    await waitState(page, "consent");
    small = await audit();
    assert(small.length === 0, `consent: ${small.join(", ")}`);
    await page.getByRole("button", { name: "Agree & continue" }).tap();
    await waitState(page, "live");
    small = await audit();
    assert(small.length === 0, `live: ${small.join(", ")}`);
    await page.context().close();
  });
  await touchBrowser.close();

  // ════════════════════════════════════════════════════════════════════════════
  section("ON-DEVICE TRACKER (sim build, a real person as the fake camera)");

  // Sample the mean colour of a box in a <video>, via a canvas.
  const meanColor = (page, selector, box) =>
    page.evaluate(
      ({ selector, box }) => {
        const v = document.querySelector(selector);
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const g = c.getContext("2d");
        g.drawImage(v, 0, 0);
        const x0 = Math.round(box.x * c.width), y0 = Math.round(box.y * c.height);
        const w = Math.round(box.w * c.width), h = Math.round(box.h * c.height);
        const d = g.getImageData(x0, y0, w, h).data;
        let r = 0, gg = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        return [r / n, gg / n, b / n];
      },
      { selector, box },
    );
  const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  /** Poll until the box in `selector` differs from `ref` by more than `min` (the first frames may not carry the garment yet). */
  const waitColorAway = async (page, selector, box, ref, min, timeout = 20000) => {
    const t0 = Date.now();
    let last = ref;
    while (Date.now() - t0 < timeout) {
      last = await meanColor(page, selector, box);
      if (colorDist(last, ref) > min) return last;
      await page.waitForTimeout(400);
    }
    throw new Error(`colour ${last.map(Math.round)} stayed within ${min} of ${ref.map(Math.round)} for ${timeout} ms`);
  };

  await check("T0", "No person in frame (test pattern): the panel asks the shopper to step in, nothing is drawn, close still stops the camera", async () => {
    const page = await open(browser, SIM);
    await goLive(page);
    await page.waitForSelector('[data-testid="hint"]', { timeout: 10000 });
    const hint = await page.textContent('[data-testid="hint"]');
    assert(/Step into the frame/.test(hint), `hint: ${hint}`);
    eq((await page.textContent('[data-testid="sim-badge"] button')).trim(), "On-device preview", "badge");
    await page.click('[data-testid="close"]');
    await waitState(page, "idle");
    eq((await gum(page)).live, 0, "live tracks after Close");
    await page.context().close();
  });

  let clip = null;
  try {
    const dir = path.join(OUT, "person");
    fs.mkdirSync(dir, { recursive: true });
    let photo = PERSON;
    if (!photo) {
      photo = path.join(dir, "pose.jpg");
      if (!fs.existsSync(photo)) {
        const res = await fetch("https://storage.googleapis.com/mediapipe-assets/pose.jpg");
        if (!res.ok) throw new Error(`download ${res.status}`);
        fs.writeFileSync(photo, Buffer.from(await res.arrayBuffer()));
      }
    }
    clip = path.join(dir, "person-720p.y4m");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", photo, "-t", "2", "-r", "15", "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x8a9aa8", "-pix_fmt", "yuv420p", clip]);
  } catch (e) {
    clip = null;
    console.log(`  – T1–T2 skipped: could not prepare a person clip (${String(e.message || e).split("\n")[0]}). Needs ffmpeg and network, or --person photo.jpg`);
  }

  if (clip) {
    const trackerBrowser = await launch({
      args: ["--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${clip}`, "--use-fake-ui-for-media-stream"],
    });
    // Lower chest of the person in the clip. The garment to check with is the WHITE knit: a dark top under an olive
    // garment barely moves the mean colour, white moves it a lot, whatever the person is wearing.
    const torso = { x: 0.45, y: 0.5, w: 0.1, h: 0.12 };
    const CONTRAST = 40;

    await check("T1", "A person in frame: tracking goes live, no hint, the garment is drawn on the torso (output differs from the camera)", async () => {
      const page = await open(trackerBrowser, SIM);
      const t0 = Date.now();
      await goLive(page, "cloud-knit");
      const took = Date.now() - t0;
      await page.waitForTimeout(1500);
      eq(await page.locator('[data-testid="hint"]').count(), 0, "hint shown although a person is in frame");
      eq((await page.textContent('[data-testid="sim-badge"] button')).trim(), "On-device preview", "badge");
      const raw = await meanColor(page, 'video[aria-hidden="true"]', torso);
      await waitColorAway(page, '[data-testid="tryon-panel"] video', torso, raw, CONTRAST).catch((e) => {
        throw new Error(`nothing drawn on the torso: ${e.message}`);
      });
      await shot(page, "16-tracker-live");
      await page.context().close();
      return `live ${took} ms after Try on (includes model load)`;
    });

    await check("T2", "Switching garments changes what is drawn, in place, with no camera restart", async () => {
      const page = await open(trackerBrowser, SIM);
      await goLive(page, "cloud-knit");
      await page.waitForTimeout(1200);
      const raw = await meanColor(page, 'video[aria-hidden="true"]', torso);
      const before = await waitColorAway(page, '[data-testid="tryon-panel"] video', torso, raw, CONTRAST);
      await page.click('[data-testid="tray-field-bomber"]'); // white -> olive
      await waitState(page, "live");
      await waitColorAway(page, '[data-testid="tryon-panel"] video', torso, before, CONTRAST).catch((e) => {
        throw new Error(`torso did not change after the switch: ${e.message}`);
      });
      eq((await gum(page)).calls, 1, "getUserMedia calls");
      eq(await appliedName(page), "Field Bomber", "applied garment");
      await shot(page, "17-tracker-switched");
      await page.context().close();
    });
    await trackerBrowser.close();
  }

  // ════════════════════════════════════════════════════════════════════════════
  if (PHOTO) {
    section(`PHOTO MODE (sim build with a render server configured)  ${PHOTO}`);

    await check("P1", "'See it properly': one photo to the render server, the still shows over the live view, labelled; Back to live returns", async () => {
      const page = await open(browser, PHOTO);
      await goLive(page);
      const btn = page.locator('[data-testid="photo-button"]');
      assert(await btn.isVisible(), "photo button missing although a render server is configured");
      assert((await page.textContent(PANEL)).includes("One photo →"), "the button must say where the photo goes");
      assert((await page.textContent('[data-testid="disclosure"]')).includes("render server"), "footer must disclose the render server");
      const posted = [];
      page.on("request", (r) => r.url().includes("/tryon") && r.method() === "POST" && posted.push(r.url()));
      await btn.click();
      // The mock answers in well under a second, so the "rendering" pill may flash too briefly to be observed: wait for the still.
      await page.waitForSelector('[data-testid="photo-still"]', { timeout: 30000 });
      eq(posted.length, 1, "POST /tryon calls");
      const label = await page.textContent('[data-testid="photo-label"]');
      assert(/Mock render/.test(label), `the mock server's answer must be labelled as a mock, got: ${label}`);
      const src = await page.getAttribute('[data-testid="photo-still"] img', "src");
      assert(src && src.startsWith("blob:"), "the still is an in-memory blob, not a stored file");
      eq(await state(page), "live", "the live session keeps running underneath");
      eq((await gum(page)).live > 0, true, "camera stays on");
      await shot(page, "18-photo-still");
      await page.getByRole("button", { name: "Back to live" }).click();
      eq(await page.locator('[data-testid="photo-still"]').count(), 0, "still dismissed");
      assert(await btn.isVisible(), "button back");
      await page.context().close();
    });

    await check("P2", "Choosing another garment drops the still; Close while rendering cancels cleanly; Esc leaves the still first", async () => {
      const page = await open(browser, PHOTO);
      await goLive(page);
      await page.click('[data-testid="photo-button"]');
      await page.waitForSelector('[data-testid="photo-still"]', { timeout: 30000 });
      await page.click('[data-testid="tray-cloud-knit"]');
      await waitState(page, "live");
      eq(await page.locator('[data-testid="photo-still"]').count(), 0, "still should go when the garment changes");
      await page.click('[data-testid="photo-button"]');
      await page.waitForSelector('[data-testid="photo-still"]', { timeout: 30000 });
      await page.keyboard.press("Escape");
      eq(await page.locator('[data-testid="photo-still"]').count(), 0, "Esc dismisses the still");
      eq(await state(page), "live", "…without closing the session");
      await page.click('[data-testid="photo-button"]');
      await page.click('[data-testid="close"]'); // mid-render (or just after): either way the session must tear down cleanly
      await waitState(page, "idle");
      eq((await gum(page)).live, 0, "tracks after Close mid-render");
      assert(page.__errors.length === 0, `console errors: ${page.__errors.join(" | ")}`);
      await page.context().close();
    });
  } else {
    console.log("\n  – photo-mode checks skipped (pass --photo <simUrl> for a build started with TRYON_PHOTO_URL=http://localhost:8010 and `python server/tryon_server.py --mock --port 8010`)");
  }

  await browser.close();

  // ── report ──
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `, ${failed.length} FAILED` : ""}  (screenshots + results.json in ${OUT}/)`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
