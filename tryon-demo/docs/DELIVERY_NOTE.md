# Delivery note — Live AI Virtual Try-On demo

**Status:** two engines behind one panel, both on hardware the user controls. The **on-device preview** (default, nothing leaves the browser) is built, rigged and verified with photos of real people in headless Chromium. **Photo mode** (a realistic still from FASHN VTON 1.5 on the user's own GPU) is wired and verified against a mock server; a real render is pending the PC install. The Decart path has been **removed** (Change 4).

## Change 4 — Decart removed; two hard rules

**The rules, as stated:** (1) no AI vendor and no API key anywhere in the project; (2) free resources only. Everything that remains satisfies both: open-weight models in the browser or on the user's own machine, free hosting (Vercel Hobby for the tracker; the photo server stays at home).

**What was removed.** `DecartProvider`, the reference-image preparer, the `/api/token` route, the `@decartai/sdk` dependency, the live-mode config (`DECART_API_KEY`, `TRYON_MODE`, `TRYON_MODEL`, `TRYON_MAX_SESSION_SECONDS`, `TRYON_FAST`), the live consent/disclosure copy that named a vendor, the "token" error kind, the live QA checks (L1–L5) and the Decart adapter tests. The component keeps a vendor-neutral consent text for any future provider that streams video elsewhere; none in this project does.

**What replaced the vendor-specific guarantees.** S21 now asserts that during a whole session every network request (page, models, WASM, images) is same-origin. The footer states that no AI service and no API key are involved.

**Where that leaves the "live" goal.** The reference-quality, real-time experience is still only produced by a generative video model on data-centre GPUs. With no vendor and no budget, the honest sequence is in [`PLAN_GENERATIVE_TRYON.md`](PLAN_GENERATIVE_TRYON.md): stills on the 3070 now, dressed clips on free GPU quota next, and a live model only if the project turns into a funded one.

---

## Change 2 — on-device preview (replaces the fixed-silhouette simulation)

**Why.** You don't want a model running on Decart's servers. No open-weights model does realistic try-on on live video, and a 30 fps generative model needs a data centre whoever runs it. So the honest local option is body tracking: the garment follows you, it is not fitted to you, and it says so.

**What it is.** `LocalPoseProvider`, the new default when no key is set. MediaPipe Pose (33 landmarks) and a skin segmenter run in the browser from self-hosted files. Each garment is a rig of three transparent images (torso, two sleeves) with anchor points. Per frame: the torso is warped with a thin-plate spline so neck, shoulder seams, sides and hem land on the body, keeping the garment's own width; each sleeve is skinned to a two-bone arm (shoulder tip → elbow → wrist) and drawn in front of or behind the torso by wrist depth; hands crossing the torso are drawn back on top from the skin mask. WebGL + 2D canvas composite it into the panel's video. Switches cross-fade in place; the camera never restarts.

**What was verified** (`scripts/qa/checklist.cjs`, T0–T2, plus 28 unit tests on the warp maths and body mapping):
- With no person in frame the panel asks the shopper to step in and draws nothing; Close still stops the camera.
- With a real person (MediaPipe's public pose photo, arms outstretched) the tracker goes live, shows no hint, and the output video differs from the raw camera on the torso; switching garments changes what is drawn with no camera restart.
- By eye, on two photos (arms out, arms crossed; see `screens/tracker-arms-out.webp`, `screens/tracker-switched.webp`, `screens/tracker-arms-crossed.webp`): the torso keeps its proportions; sleeves follow the arms through 90°; crossed forearms draw in front; hands show through at the wrists; no notch or epaulette at the shoulders.

**What was not verified.** A real webcam on a real device, frame rate on real hardware (headless software GL runs at 1–2 fps, which says nothing), phones, and people turning sideways or sitting. Expect it smooth on a laptop; a recent phone should be usable. First use loads 36 MB of models from your own server.

**Design decisions worth knowing.**
- A single whole-garment warp was tried first and rejected: with arms out it sheared the torso into a cape, and on garments whose sleeves hang beside the body it folded the image over itself. Rigging (torso + two bones) fixed both.
- Pixel ownership vs. per-part films: the first split gave the sleeve-head overlap to the sleeve, leaving a notch in the body when the arm rose. The generator now composites each part into its own film inside the art engine, so the body keeps the pixels under the sleeve caps.
- Scale comes from the shoulder *seams*; the sleeve pivots at its own *tip*, placed relative to the seam at that scale. Deriving scale from the tips shrank everything by a quarter.
- The torso's hem width comes from the garment, its hem height from the hips. Pinning the hem to the hip joints turned a boxy sweater into a tank top.
- Labelling: "On-device preview" with a tooltip that says it is not AI fit or drape. The fallback (models or WebGL unavailable) stays "Simulation".

**Known limits.** Flat images on joints: no drape, no fabric, no occlusion except hands. Turning sideways narrows the garment but cannot show its side. The shirt's large sleeve caps read as caps when the arms are raised. Hand overlay depends on the segmenter finding skin at the wrist.

---

## Change 3 — photo mode: a realistic still on your own GPU ("See it properly")

**Why.** The tracker shows the interaction but cannot show fit, and the screenshots say so. Generation is the only way to a convincing image, and the only generation that runs at home today is still-image try-on. This is Stage A of [`PLAN_GENERATIVE_TRYON.md`](PLAN_GENERATIVE_TRYON.md).

**What it is.** `server/tryon_server.py`, a standard-library Python server that runs FASHN VTON 1.5 (Apache-2.0, ~8 GB VRAM, bf16 on RTX 30-series) on the shopper's own machine, with a `--mock` mode. `providers/photo/client.ts` talks to it (JSON, base64 images, timeouts, error kinds). With `TRYON_PHOTO_URL` set, the live panel gets **See it properly**: `controller.captureFrame()` grabs one raw camera frame, the garment's product image goes with it, and the result shows over the live view as a mirrored, labelled still ("Rendered still · model · N s on your PC", or "Mock render" when the server has no model). The live session keeps running; Esc, "Back to live" or picking another garment drops the still; Close mid-render cancels. The still is an in-memory blob, never stored. The footer and the button both say where the photo goes.

**What was verified.** Mock server: health, a render, bad input, CORS preflight, from this sandbox. Client: 6 unit tests (body shape, error mapping, timeout, abort pass-through, health). Panel: QA checks P1–P2 against the mock server (button present only when configured, one POST per render, labelled mock still, blob URL, live session untouched underneath, garment switch and Esc drop the still, Close mid-render stops the camera cleanly).

**Not verified.** A real render: FASHN has not been run on the user's 3070 (this sandbox has no GPU). Expect the first render to pay the model load unless `--preload` is used; 8 GB is FASHN's stated requirement, so out-of-memory is the first thing to watch for.

**Decisions.** FASHN over CatVTON for the licence (Apache vs non-commercial) at the same VRAM. JSON+base64 over multipart so the server needs no framework (Python's `cgi` is gone in 3.13). The still is shown mirrored so it reads as the same mirror as the live view. The photo flow lives in React state beside the camera state machine, not inside it: it never changes the camera lifecycle.

---

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

All under `tryon-demo/`; nothing outside it was modified.

Change 1 (the demo):
- `src/components/tryon/` — the reusable component: `TryOn.tsx`, `controller.ts`, `machine.ts`, `camera.ts`, `copy.ts`, `drag.ts`, `types.ts`, `providers/{decart,simulation,reference,errors}.ts`, `ui/*`
- `src/app/` — `page.tsx`, `layout.tsx`, `globals.css`, `api/token/route.ts`
- `src/components/shop/`, `src/data/garments.ts`, `src/lib/config.ts`
- `public/garments/*.webp` (4 images) and `scripts/garments.manifest.json` (how they were made)
- `tests/` — unit tests; `scripts/qa/checklist.cjs` — the executable PRD checklist
- `README.md`, `.env.example`, `docs/`

Change 3 (photo mode):
- `server/tryon_server.py`, `server/README.md` — the render server and its PC setup
- `src/components/tryon/providers/photo/client.ts` (+ `tests/photo-client.test.ts`), `controller.ts` (`captureFrame`), `TryOn.tsx` (photo flow), `ui/Stage.tsx` (button, rendering/error pills, still overlay), `copy.ts`, `types.ts` (`category`), `src/lib/config.ts` (`TRYON_PHOTO_URL`), `scripts/qa/checklist.cjs` P1–P2
- `docs/PLAN_GENERATIVE_TRYON.md` — the staged plan

Change 2 (on-device preview):
- `src/components/tryon/providers/local/` — `localPose.ts` (provider), `pose-map.ts` (body mapping), `tps.ts` (thin-plate spline + mesh), `skin.ts` (two-bone sleeves), `gl-mesh.ts` (WebGL)
- `public/models/mediapipe/` — self-hosted WASM runtime, pose model, skin segmenter (36 MB)
- `public/garments/parts/` — 12 rig images; `scripts/make-cutouts.mjs` — generates them and the anchors from the art engine
- `types.ts` (parts, anchors, hint channel), `machine.ts`/`controller.ts` (hint), `copy.ts` (labels, hints, on-device consent and footer copy), `ui/Stage.tsx` (hint pill), `ui/SimBadge.tsx` (label from the provider), `src/data/garments.ts` (rigs)
- `tests/tps.test.ts`, `tests/skin.test.ts`, `tests/pose-map.test.ts`; `scripts/qa/checklist.cjs` T0–T2
