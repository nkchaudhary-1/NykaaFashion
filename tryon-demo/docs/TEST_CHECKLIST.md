# Test checklist — run and ticked

The PRD's "Test checklist (the brief's required tests, concrete)", executed. Every ✅ below is a real assertion in headless Chromium with a **fake camera device**, run by [`scripts/qa/checklist.cjs`](../scripts/qa/checklist.cjs) (30 checks) plus 118 unit tests (`npm test`). A box is only ticked if something *proved* it. Anything that needs a real GPU or a real device is **left unticked on purpose**.

```bash
npm run build && npx next start -p 3200
python3 server/tryon_server.py --mock --port 8010 &
TRYON_PHOTO_URL=http://localhost:8010 npx next start -p 3202
node scripts/qa/checklist.cjs http://localhost:3200 --photo http://localhost:3202 --out qa-output
```

## The PRD's nine items

- [x] **Camera permission: allow → connects; deny → denied state + retry; dismiss → recoverable.**
  S3 (allow → live), S10 (deny → "Camera's blocked." + how-to-enable, Retry works), S11 (dismissed → its own copy, Retry works; no camera → "No camera found.", still a message after 1.2 s: no infinite spinner), S12 (requesting-permission state shown).
- [x] **Switching: change garment while live → updates, camera does *not* restart; rapid switches → last wins, no partial state.**
  S4 (camera streams, live-track count and `getUserMedia` calls unchanged across a swap), S5 (four clicks in one frame → last wins), S6 (second Try on from a card = a switch), S16 (drag-to-switch). Unit tests: the swap queue sends only the final garment of a burst and always the **complete** garment (`controller.test.ts`, `decart.test.ts`: `set()` always receives exactly `prompt + image + enhance`).
- [x] **Closing: camera light off, tracks stopped, session torn down; close from fullscreen too; unmount/tab-close → same teardown.**
  S7 (zero live tracks, no leftover `<video>`, no camera indicator), S8 (Esc leaves fullscreen *without* closing; Close from fullscreen leaves fullscreen **and** stops tracks), S9 (`pagehide`), S15 (hidden tab), S12 + S13 (a **late** camera grant, or a late connect, after Close can't revive anything), unit tests for ordering and idempotency.
  *(Mutation-checked: removing the track stop, or the late-grant guard, makes the suite fail.)*
- [x] **Mobile layout: 360 px no overflow; front camera; tap-select; controls reachable.**
  S19 (no horizontal overflow at 360/390/768/1024/1280/1440 in idle, consent, live **and** fullscreen), M1 (emulated coarse pointer; tap to select; `facingMode:"user"`; portrait 720×1280 capture; Close and thumbnails on-screen and ≥ 44 px; switching works inside fullscreen), M2 (every control ≥ 44 px).
- [x] **Failure states: kill network mid-session → error + retry without reload; a provider failure → error, not a hang.**
  S14 (stream drop → "Lost the connection." with the camera **actually** off; Retry reconnects; page marker proves no reload). Unit tests: reconnect give-up, connect timeout, camera unplugged, provider failure kinds.
- [x] **Consent: no camera access before agree; decline → no camera; copy says where frames go.**
  S2 (consent shown, `getUserMedia` count 0; Not now → still 0; the copy says video stays in the tab and never says it is sent anywhere), S16 (a drop still goes through consent).
- [x] **Simulation: badge visible; not presented as real model output.**
  S1/S3 (badge present idle and live; it reads **On-device preview**), S2 (consent says video stays in the tab, only because that is true), S20 + readout ("Latency isn't measured in simulation": no invented number), S21 (**every request during a whole session is same-origin**: page, models, WASM, images), T0 (with no person in frame the panel says so instead of drawing anything).
- [ ] **Live: real model output renders; latency measured and reported; arms-raised observed.**
  **Not applicable any more:** the project's hard rule excludes AI vendors and API keys. A live generative engine you own is a later stage of the plan, not something this build can show.
- [x] **A11y: keyboard-only run; focus visible; reduced motion; AA contrast.**
  S17 (Tab to Try on → Enter → focus lands on the new state's heading → Agree → Esc closes and stops the camera; visible 2 px+ focus ring), S18 (reduced motion: animations ≈ 0 ms, flow completes), A1 (**axe-core, WCAG 2.1 A/AA + best-practice: zero violations** across idle, consent, denied, live, error), `contrast.test.ts` (17 pairs computed from the real tokens: AA text ≥ 4.5:1, non-text ≥ 3:1), S22/M2 (touch targets ≥ 44 px).
  ⚠ *Automated checks are not a conformance audit; a VoiceOver/NVDA pass is still owed.*

## On-device preview (Change 2)

- [x] **Tracking goes live on a real person and draws the garment on the body.** T1: MediaPipe's public pose photo (arms outstretched) as the fake camera; no "step into frame" hint; the output video's torso region differs from the raw camera's.
- [x] **Switching changes what is drawn, in place.** T2: torso colour changes after choosing another garment; `getUserMedia` called once.
- [x] **No person → honest hint, nothing drawn, Close still stops the camera.** T0.
- [x] **Warp maths and body mapping.** `tps.test.ts` (interpolation, affine reproduction, smoothness, regularisation), `skin.test.ts` (identity, rotation, side offsets, elbow blend, extrapolation), `pose-map.test.ts` (orientation, scale, hanging/raised/unseen arms, proportions, hands-in-front, tilt, smoothing), `garments.test.ts` (part files exist, anchors sane).
- [ ] Real webcam, real device, frame rate on hardware, phones, sideways poses: **not done**.

## Photo mode (Change 3)

- [x] **"See it properly" sends one photo to the configured render server and shows the labelled still over the live view; Back to live returns.** P1 (against `server/tryon_server.py --mock`): button only when `TRYON_PHOTO_URL` is set (S1 asserts its absence otherwise), the footer and the button name the server, exactly one `POST /tryon`, the still is a `blob:` URL labelled "Mock render", the live session and camera keep running underneath.
- [x] **Switching garment drops the still; Esc drops it without closing; Close mid-render cancels and stops the camera.** P2.
- [x] **Client contract.** `photo-client.test.ts`: JSON/base64 body, defaults, error kinds (busy, not installed, bad request, render failed, unreachable, timeout), caller abort passes through, health.
- [ ] A real FASHN render on the 3070: **not done here** (no GPU in the sandbox).

## Also verified (beyond the PRD's nine)

- [x] Secrets: there are none. The config object handed to client components carries only your own render server's address (`config.test.ts`).
- [x] Reference images are real ≥ 512 px JPEGs with a plain background, one per garment (L5), and every garment prompt is 20–30 words and "Substitute/Add" (`garments.test.ts`).
- [x] One build; photo mode switches on from server env at request time (the two servers in the commands above serve the identical build).
- [x] Typecheck, ESLint and the production build are clean.
- [x] All earlier S/M/A/L checks still pass with the on-device preview as the default engine (its green-test-pattern path is the "no person" state).

## Left unticked on purpose (need a key or a device)

- [ ] Real Lucy VTON output renders; drape and arm tracking observed.
- [ ] Live time-to-first-frame and time-to-switch measured (range reported in the delivery note).
- [ ] Network cut *during a real live session* (the SDK's reconnect → our give-up path is unit-tested, not exercised live).
- [ ] The token's server-side `maxSessionDuration` honoured by Decart.
- [ ] Real iOS Safari (front camera, WebRTC, fixed-overlay fullscreen).
- [ ] Screen-reader pass (VoiceOver / NVDA).
