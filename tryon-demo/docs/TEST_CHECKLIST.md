# Test checklist — run and ticked

The PRD's "Test checklist (the brief's required tests, concrete)", executed. Every ✅ below is a real assertion in headless Chromium with a **fake camera device**, run by [`scripts/qa/checklist.cjs`](../scripts/qa/checklist.cjs) (30 checks) plus 104 unit tests (`npm test`). A box is only ticked if something *proved* it. Anything that needs a real key is **left unticked on purpose**.

```bash
npm run build
env -u DECART_API_KEY npx next start -p 3200                       # Simulation (no key)
DECART_API_KEY=dct_dummy npx next start -p 3201                    # same build, dummy key: live UI + token failure path
node scripts/qa/checklist.cjs http://localhost:3200 http://localhost:3201 --out qa-output
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
- [x] **Failure states: kill network mid-session → error + retry without reload; bad/no token (live) → error, not a hang.**
  S14 (stream drop → "Lost the connection." with the camera **actually** off; Retry reconnects; page marker proves no reload), L2 (dummy key → the real Decart rejects it; the panel shows an error **~1 s** after Try on, camera off; Retry mints a fresh token). Unit tests: reconnect give-up, connect timeout, camera unplugged, provider failure kinds.
  ⚠ *A true network cut against the live service is not simulated here (see unticked items).*
- [x] **Consent: no camera access before agree; decline → no camera; copy states frames go to Decart + nothing stored.**
  S2 (consent shown, `getUserMedia` count 0; Not now → still 0), S16 (a drop still goes through consent), L1 (live wording names Decart, says "We don't record or save anything", carries Decart's training-policy note, never says "stays in this browser tab").
- [x] **Simulation: badge visible; not presented as real model output.**
  S1/S3 (badge present idle and live), S2 (sim consent says video stays in the tab, only because that is true), S20 + sim readout ("Latency isn't measured in simulation": no invented number), S21 (Simulation never downloads the provider SDK and never calls `/api/token`), L1 (no badge in live mode).
- [ ] **Live: real model output renders; latency measured and reported; arms-raised observed.**
  **Not done: needs a Decart key.** Nothing here observes Lucy VTON output. The instrumentation is in place and the live pass is spelled out in [`DELIVERY_NOTE.md`](DELIVERY_NOTE.md).
- [x] **A11y: keyboard-only run; focus visible; reduced motion; AA contrast.**
  S17 (Tab to Try on → Enter → focus lands on the new state's heading → Agree → Esc closes and stops the camera; visible 2 px+ focus ring), S18 (reduced motion: animations ≈ 0 ms, flow completes), A1 (**axe-core, WCAG 2.1 A/AA + best-practice: zero violations** across idle, consent, denied, live, error), `contrast.test.ts` (17 pairs computed from the real tokens: AA text ≥ 4.5:1, non-text ≥ 3:1), S22/M2 (touch targets ≥ 44 px).
  ⚠ *Automated checks are not a conformance audit; a VoiceOver/NVDA pass is still owed.*

## Also verified (beyond the PRD's nine)

- [x] Secrets: the permanent key is in no HTML, RSC payload, JS chunk, or token-route response (L3); `NEXT_PUBLIC_DECART*` appears nowhere; the config object handed to client components carries no key (`config.test.ts`).
- [x] The provider SDK is lazy: absent from the initial load, fetched once consent is shown (L4), never fetched in Simulation (S21).
- [x] Reference images are real ≥ 512 px JPEGs with a plain background, one per garment (L5), and every garment prompt is 20–30 words and "Substitute/Add" (`garments.test.ts`).
- [x] One build, two modes, chosen by server env at request time (the two servers above serve the identical build).
- [x] Typecheck, ESLint and the production build are clean.

## Left unticked on purpose (need a key or a device)

- [ ] Real Lucy VTON output renders; drape and arm tracking observed.
- [ ] Live time-to-first-frame and time-to-switch measured (range reported in the delivery note).
- [ ] Network cut *during a real live session* (the SDK's reconnect → our give-up path is unit-tested, not exercised live).
- [ ] The token's server-side `maxSessionDuration` honoured by Decart.
- [ ] Real iOS Safari (front camera, WebRTC, fixed-overlay fullscreen).
- [ ] Screen-reader pass (VoiceOver / NVDA).
