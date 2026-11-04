# Virtual try-on, on your own hardware — demo

A standalone Next.js demo of **camera-based virtual try-on**: a shopper clicks **Try on**, sees the garment on their own moving camera feed, and switches pieces **without the camera restarting**. Built from the PRD "Live AI Virtual Try-On Clothing Site", then re-scoped around two hard rules:

1. **No AI vendor, no API key.** Nothing in this project talks to a third-party AI service. Models are open weights running in your browser or on a machine you control.
2. **Free resources only.** The browser, your own GPU, and free hosting. Where "free" caps quality, the docs say so instead of hiding it.

> **Local / private review first; Vercel later.** Sample products, no cart, no checkout, no accounts, and no video or photo is ever stored.

The try-on panel is the product. The shop around it is a thin frame. The panel is a reusable `<TryOn>` component behind a provider adapter:

| | **On-device preview** (default) | **Photo mode** (optional, your own GPU) |
| --- | --- | --- |
| What draws the garment | Body tracking in your browser warps a rigged image of the garment onto your shoulders, arms and torso | FASHN VTON 1.5 (open weights, Apache-2.0) renders a realistic still on a PC you own |
| Follows your movement | Yes: turns, raised arms, crossed arms | No: hold still, 5–20 s per image |
| Looks like real fit and drape | **No.** A flat image on your joints, labelled "On-device preview" | Yes, for a still |
| Where your video goes | **Nowhere.** No server, no third-party request, works offline | One photo to your own machine on your LAN; nothing kept |
| Needs | Nothing | An NVIDIA GPU with 8 GB+ (see `server/README.md`) |

Where this goes next, including live generative try-on you own, is in [`docs/PLAN_GENERATIVE_TRYON.md`](docs/PLAN_GENERATIVE_TRYON.md).

| Consent, before any camera | On-device preview, arms out | On-device preview, switched |
| --- | --- | --- |
| ![Consent step](docs/screens/consent-simulation.webp) | ![On-device preview on a person with arms outstretched](docs/screens/tracker-arms-out.webp) | ![On-device preview after switching garment](docs/screens/tracker-switched.webp) |

*Screenshots from headless Chromium with a photo of a person as the fake camera (MediaPipe's public pose test image). The garment is the tracker's warped image, not AI output; the Live AI mode has not been captured because it needs a key.*

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it. **With no key it runs the on-device preview**: your real camera, the garment following your body, and an unmissable **On-device preview** badge. Nothing leaves your browser tab. Camera access needs `https://` or `localhost`.

```bash
npm test             # 118 tests: state machine, controller, warp maths, body mapping, photo client, config, catalogue, contrast
npm run typecheck && npm run lint
npm run build && npm start
```

## On-device preview: how it works

Everything runs in the browser, from files served by this app (`public/models/mediapipe`, 36 MB: the MediaPipe WASM runtime, a pose model and a skin segmenter). No CDN, no third party, no upload.

1. **Pose.** MediaPipe Pose finds 33 body landmarks per frame.
2. **Rig.** Each garment is three transparent images, torso and two sleeves, with anchor points: neck, shoulder seams, torso sides, hem corners, sleeve tips, elbows, cuffs (`src/data/garments.ts`).
3. **Torso.** A thin-plate-spline warp pins the torso's anchors to the body. The body decides *where* (shoulders, hips, lean); the garment keeps its *own* width, so a boxy sweater stays boxy instead of collapsing onto the hip joints.
4. **Sleeves.** Each sleeve is skinned to a two-bone arm (shoulder tip → elbow → wrist), so a raised arm rotates the whole sleeve. Arms that aren't visible let the sleeve hang. A sleeve draws in front of the torso when the wrist is closer to the camera than the shoulders.
5. **Hands.** When a hand crosses the torso, skin pixels (from the segmenter) are drawn back on top inside a circle around the wrist.
6. **Compositing.** WebGL draws the warped parts; a 2D canvas composites them over the camera frame and feeds the panel's video. Garment switches cross-fade in place.

What it deliberately is not: fit, drape, fabric, or occlusion by anything but hands. It is honest about that in the badge, the consent step and the footer. If the models or WebGL fail to load, the panel falls back to the fixed silhouette placeholder, labelled **Simulation**.

**Adding a garment.** The four sample rigs are generated from the parent repo's art engine by `scripts/make-cutouts.mjs` (it renders each piece into its own film, so the body keeps the pixels under the sleeve heads, and measures the anchors). For real photography: cut the photo into the same three transparent parts in Figma, drop them in `public/garments/parts/`, and write the part boxes and anchors into `src/data/garments.ts` as fractions of the full cutout. `npm test` checks they're sane.

## Photo mode: a realistic still on your own GPU

The tracker shows the interaction; it can't show fit. For a real render without any cloud, run the render server on a machine with an NVIDIA GPU (8 GB+), using FASHN VTON 1.5 (Apache-2.0). Setup is in [`server/README.md`](server/README.md). Then:

```
TRYON_PHOTO_URL=http://192.168.1.50:8000
```

in `.env.local`, restart, and the live panel gets **See it properly**: hold still, one camera photo and the garment image go to that server, and 5–20 s later the still shows over the live view, labelled with the model and the time it took. The live session keeps running; Esc or "Back to live" returns. Nothing is stored anywhere; the still is an in-memory blob. `python server/tryon_server.py --mock` fakes the server for wiring tests; its results are stamped and labelled "Mock render".

The plan for taking this further (dressed clips, then toward real-time) is in [`docs/PLAN_GENERATIVE_TRYON.md`](docs/PLAN_GENERATIVE_TRYON.md).

## How it fits together

```
 page (server)  ──resolveConfig()──▶  photoUrl (your own render server, or none)       (never a secret)
      │
 <TryOnDemo> ── garment cards ── ref.tryOn(id) ──▶ <TryOn>        reusable component
                                                       │
                                            TryOnController        camera + session + teardown
                                  pure reducer (machine.ts)  ·  epoch-guarded async
                                                       │
                                               TryOnProvider
                                       LocalPoseProvider (default)
                            MediaPipe pose + skin segmenter, self-hosted
                            rig: torso TPS + two-bone sleeves, WebGL
                            (falls back to SimulationProvider: fixed silhouette)

 "See it properly" ──▶ providers/photo/client.ts ──▶ server/tryon_server.py on your PC (FASHN VTON 1.5)
```

- **State machine** (`src/components/tryon/machine.ts`): the PRD's eight states and every transition row, as a pure reducer.
- **Controller** (`controller.ts`): opens the camera only after consent, discards any async result from a session that was already closed (a late "Allow" after Close is switched straight back off), queues garment swaps (leading edge, last selection wins, always the **complete** garment), and tears down in a fixed order: invalidate async work → stop tracks synchronously → disconnect.
- **Adapter** (`providers/`): `LocalPoseProvider` and `SimulationProvider` implement one interface, so `<TryOn>` cannot tell them apart; a future generative provider slots in the same way. The tracker's maths (`providers/local/tps.ts`, `skin.ts`, `pose-map.ts`) is pure and unit-tested in Node; only `localPose.ts` and `gl-mesh.ts` touch the browser.

## Reuse `<TryOn>` in a real storefront

```tsx
import { TryOn, LocalPoseProvider, type TryOnHandle } from "@/components/tryon";

const provider = useMemo(() => new LocalPoseProvider(), []);
const tryOn = useRef<TryOnHandle>(null);

<button onClick={(e) => tryOn.current?.tryOn(product.id, e.currentTarget)}>Try on</button>
<TryOn ref={tryOn} garments={products} provider={provider} onEvent={track} />
```

`<TryOn>` takes a product list and a provider and runs. It imports nothing from the demo page or the demo's data. To let desktop shoppers drag a card onto it, spread `garmentDragProps(id)` on the card.

## Swap the catalogue

Edit **`src/data/garments.ts`**, nothing else. Each product is `{ id, name, price, image, prompt }`:

- `image`: a **garment-only** photo on a plain background, ≥ 512×512, in `public/garments/`. Not on-model.
- `prompt`: 20–30 words, "Substitute/Add …" pattern, concrete about colour, fabric, neckline and how it's worn. Garment quality depends on it. `npm test` enforces the word count.

The four sample images are generated by the parent repo's art engine (`scripts/garments.manifest.json`). They are fictional and stand in for real photography.

## Privacy, honestly

- **On-device preview:** no network request carries camera frames; the models themselves are served from this app's own origin. The QA suite asserts that during a whole session every request is same-origin.
- **Photo mode:** one camera photo and the garment image go to your own render server on your LAN, which answers and keeps nothing. The button and the footer both say where the photo goes.
- **This site stores nothing:** no recording, no upload, no saved frames. Consent is asked at the start of every camera session.
- **Consent is its own step**, before the browser's camera prompt. Browser permission alone is not informed consent.
- **Kill switch:** Close (×), Esc, leaving the tab, hiding the tab, or unmounting stops every camera track and tears down the session. A "camera on" indicator is visible whenever the camera is active.

## Tests

```bash
npm test                                                       # unit + contract tests, no browser
npm run build && npm start -- -p 3200                          # the demo
python3 server/tryon_server.py --mock --port 8010              # a fake render server (optional, for the photo-mode checks)
TRYON_PHOTO_URL=http://localhost:8010 npm start -- -p 3202     # the demo with photo mode on (optional)
node scripts/qa/checklist.cjs http://localhost:3200 --photo http://localhost:3202 --out qa-output
```

`scripts/qa/checklist.cjs` is the PRD's test checklist as an executable run in headless Chromium with a fake camera (needs Playwright; `npm i --no-save axe-core` adds the accessibility pass; `ffmpeg` enables the tracker checks, which feed a photo of a real person to the fake camera and verify the garment is drawn and switched on the body). See [`docs/TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md) for results and [`docs/DELIVERY_NOTE.md`](docs/DELIVERY_NOTE.md) for what is and isn't verified.

## Known limits

- **The on-device preview is an approximation and has only been driven by photos in headless Chromium**, never by a real webcam on a real device. Frame rate on real hardware is unmeasured (expected: smooth on a laptop, usable on a recent phone). Turning sideways narrows the garment but can't show its side; nothing but hands occludes it; the shirt's big sleeve caps read as caps when arms are raised.
- **Photo mode has not been run on a real GPU here** (this sandbox has none); the mock server proves the wiring only.
- **Live, generative try-on you own does not exist yet** and no free or local path reaches it today; the plan document is honest about what each stage costs.
- iOS Safari needs a real-device pass (fullscreen uses a fixed overlay because iPhone has no element fullscreen).
