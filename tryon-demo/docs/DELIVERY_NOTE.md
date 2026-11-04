# Delivery note — Live AI Virtual Try-On demo

**Status:** built end to end and verified in **Simulation**. The **live path is fully wired but has never run against a real Decart key**, so real model output, drape, arm tracking and live latency are **unobserved**. Everything else in the PRD's checklist is verified (see [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md)).

## Measured latency range

**None measured.** No key was available, and the PRD's rule is *measure, never promise* — so there is no number here and none in the UI copy.

What exists is the instrumentation, ready for the first live session:

| Figure | Definition | Where to read it |
| --- | --- | --- |
| **Time to first frame** | camera granted → first frame presented **after** Decart reports `generating` | panel readout ("First frame …") and `session_live.ttffMs` |
| **Time to switch** | `set()` sent → first frame presented **after** Decart acknowledges it | panel readout ("Last switch …") and `garment_switched.switchMs` |
| Connection quality | the SDK's own verdict (`good / fair / poor / critical`) | panel readout |

Be precise about what time-to-switch is: the client cannot see *when the new garment is actually rendered*, only when the server acknowledged the swap and the next frame arrived. It is a **lower bound** on the perceived swap, not the swap itself. Judge the real feel by eye as well as by the number.

The ~30–95 ms figures that appear in the *simulation's* `[tryon]` console events are canvas timings, not latency of anything. The panel deliberately shows **"Latency isn't measured in simulation"** instead of a number.

## Live vs simulated

| | Simulation (default, no key) | Live (key set) |
| --- | --- | --- |
| Camera, consent, permission, close, teardown | **real** | **real** |
| Garment switching: queue, last-wins, full-state send | **real** (same controller) | **real** |
| What is drawn on you | a fixed, crude garment-shaped placeholder; does **not** track you | Lucy VTON output (**unobserved**) |
| Frames leave the device | **No** (verified: no token call, SDK never downloaded) | **Yes → Decart** |
| Label | **Simulation** badge, always visible | none |
| Latency readout | "not measured" | measured (unobserved) |

**The exact blocker for live:** a provisioned Decart API key (platform.decart.ai) and acceptance of per-second billing (~$0.02/sec at 720p; *confirm against your account*, because the pricing page and model docs disagree on the model name).

**What was verified about the live path without a key** (real Decart API, dummy key): the browser asks our `/api/token`; the route reaches Decart, which rejects the key (`TOKEN_CREATE_ERROR`, 401); the panel shows an error ~1 s after Try on with the camera off; Retry mints a fresh token; the key is in no HTML, JS chunk or response; the SDK downloads only after the shopper starts a try-on; reference images are prepared as real JPEGs. The adapter's `connect` / `set()` / disconnect contract is covered against a fake SDK.

## Validate with a key (the 15-minute live pass)

1. **Put the key in `.env.local`**, restart, confirm the Simulation badge is gone.
2. **Does `generating` fire?** The panel calls the session live only when the SDK reports `generating`. If you see "Taking too long" with video flowing, this assumption is wrong. See `mapState` in `providers/decart.ts`.
3. **Time to first frame and time to switch:** 10+ samples, note device and network, report the range here.
4. **Drape and arms:** raise arms, turn, move. Observe; do not assume.
5. **Tune prompts** in `src/data/garments.ts` per garment (quality depends on them).
6. **Confirm the token's `maxSessionDuration` is honoured:** the session should end at 180 s with no help from the client cap.
7. **Confirm model name and price** on your account; resolve the `lucy-2.1-vton` vs `lucy-vton-3.6` mismatch.
8. **Confirm frame retention and no-training terms with Decart in writing** before any non-demo use. Public docs state no retention window; the consent copy asserts none.
9. **iOS Safari on a real phone:** `getUserMedia` + WebRTC, front camera, the fixed-overlay fullscreen.

## Decisions I made (the PRD's open questions)

- **Where it lives:** `tryon-demo/` in this repo, fully standalone (own `package.json`, no shared code). The PRD asks for a self-contained demo with a flat, no-nav page, which the Nykaa app's shell would have fought. It moves to its own repo with `git mv`.
- **Sim-first**, as recommended. Live is `DECART_API_KEY` + restart.
- **Fourth garment:** an **Oxford Stripe Shirt** (strong vertical pattern makes drape easy to judge). One data-file edit to change.
- **Latency readout: in the shipped UI**, live mode only.
- **Visual direction:** my own minimal-light system (warm paper, ink actions, serif headline, one signal colour reserved for "camera on"), not Anywear's.
- **Hero garment:** the art engine has no "squiggle" pattern, so the patterned sweater is a **blue zigzag** knit. Closest honest match; swap the image for real photography whenever.

## Deviations from the PRD's text (all deliberate)

- **Provider state ≠ panel state.** `SessionState` (the PRD's 8 states) belongs to the controller; the provider only reports `ProviderState` (`connecting / live / reconnecting / disconnected`). A provider cannot know about consent or permission.
- `connect()` also takes `initialGarment`, so the first frame already shows a garment (Decart accepts it as `initialState`).
- Optional `prepare()` on providers warms the SDK chunk and reference images when consent appears. It opens no camera and no connection.
- **Error → Retry** goes to `connecting` and re-opens the camera there (it was stopped when the session dropped), so `CAMERA_DENIED` is also allowed from `connecting`.
- **Switch queue is leading-edge**, not debounced: the first click goes out immediately; clicks during flight collapse to the newest. Every send is the complete garment.
- **Consent is not persisted.** The PRD allowed a session-scoped boolean; nothing would read it, and every session is a new transmission, so consent is asked every time.
- **Simulation has no latency number**, rather than a meaningless one.

## Additions beyond the brief

- **Session cap** (default 180 s, `TRYON_MAX_SESSION_SECONDS`): server-side on the token **and** client-side. Directly mitigates the PRD's per-second-billing risk.
- **Hidden-tab "Paused" state** with Resume (the PRD said pause *or* tear down; this tears down).
- **Switch-failed notice:** a failed `set()` keeps the session and the garment still on screen, and says so.
- Minimum 450 ms "switching" state so a fast swap reads as deliberate, not a glitch. It does not touch measured figures.
- Token route: same-origin check, 10 s mint timeout, logs only the SDK error **code**.
- Cards say "Selected" until a garment is actually rendered, then "On you".

## Not done / consciously left

- LLM prompt-enhance and user-uploaded garments (PRD "Could"). Save/share (PRD "Won't").
- **Token hardening not applied:** `allowedModels` / `allowedOrigins` on the minted token. I can't test them without a key and a wrong value would break the first live run. Add after the live pass.
- Real photography, and a manual screen-reader pass (VoiceOver/NVDA). Automated axe is clean, which is not a conformance audit.
- **No public deploy**, per the brief.

## Full change list

All new, under `tryon-demo/`; nothing outside it was modified.

- `src/components/tryon/` — the reusable component: `TryOn.tsx`, `controller.ts`, `machine.ts`, `camera.ts`, `copy.ts`, `drag.ts`, `types.ts`, `providers/{decart,simulation,reference,errors}.ts`, `ui/*`
- `src/app/` — `page.tsx`, `layout.tsx`, `globals.css`, `api/token/route.ts`
- `src/components/shop/`, `src/data/garments.ts`, `src/lib/config.ts`
- `public/garments/*.webp` (4 images) and `scripts/garments.manifest.json` (how they were made)
- `tests/` — 104 unit tests; `scripts/qa/checklist.cjs` — the executable PRD checklist
- `README.md`, `.env.example`, `docs/`
