// LocalPoseProvider — on-device try-on preview. Nothing leaves the browser.
//
// Each frame: MediaPipe finds the shopper's pose (33 landmarks). The garment is a small RIG: a torso image and two
// sleeve images. The torso is warped so its neck, shoulders, sides and hem land on the tracked body (thin-plate
// spline); each sleeve is skinned to a two-bone arm (shoulder → elbow → wrist) and drawn in front of or behind the
// torso depending on how close the arm is to the camera. WebGL draws the parts over the camera frame; a skin
// segmenter puts hands back on top when they cross the torso.
//
// What this is NOT: fit, drape, or fabric. It is flat images following your joints. The panel labels it as such.
// If the models or WebGL are unavailable, it falls back to the plain silhouette placeholder, still labelled.
//
// The runtime (WASM) and both models are served from our own origin (/models/mediapipe): works offline, no
// third-party requests.
import type { ImageSegmenter, PoseLandmarker } from "@mediapipe/tasks-vision";
import { copy } from "../../copy.ts";
import type { ConnectOptions, Garment, GarmentAnchors, GarmentPart, TrackingHint, TryOnProvider, TryOnSession } from "../../types.ts";
import { SimulationProvider } from "../simulation.ts";
import { GlMesh } from "./gl-mesh.ts";
import { bodyTargets, smoothLandmarks, type ArmTargets, type BodyTargets, type Landmark, type Sleeve } from "./pose-map.ts";
import { skinSleeve, type PartFrame } from "./skin.ts";
import { buildMesh, solveTps, warpMesh, type Mesh } from "./tps.ts";

type Vision = typeof import("@mediapipe/tasks-vision");

export interface LocalPoseProviderOptions {
  /** Where the WASM runtime and the models are served from. Default: self-hosted under /models/mediapipe. */
  assetsPath?: string;
  /** Skin segmentation for hands-in-front. Off = cheaper, hands get covered by the garment. Default on. */
  segmentation?: boolean;
  /** Landmark smoothing, 0..1. Higher follows faster, lower is calmer. Default 0.55. */
  smoothing?: number;
  loadVision?: () => Promise<Vision>;
}

type Engine = { pose: PoseLandmarker; seg: ImageSegmenter | null; skinIndex: number };
type PartTex = { key: string; image: HTMLImageElement; frame: PartFrame; mesh: Mesh };
type Rig = {
  id: string;
  w: number;
  h: number;
  anchors: GarmentAnchors;
  sleeve: Sleeve;
  torso: PartTex;
  sleeveL: PartTex | null;
  sleeveR: PartTex | null;
};
type Ok = Extract<BodyTargets, { ok: true }>;

const MODELS = { pose: "pose_landmarker_lite.task", segmenter: "selfie_multiclass_256x256.tflite" };
const FADE_MS = 300;
const SEG_WIDTH = 256;
const LOST_AFTER_MS = 600;
// A sleeve switches to "in front of the torso" below the first depth and back behind it above the second.
const FRONT_ON = -0.12;
const FRONT_OFF = -0.06;

export class LocalPoseProvider implements TryOnProvider {
  readonly mode = "sim" as const;
  private flavor: "tracking" | "silhouette" = "tracking";
  private assetsPath: string;
  private segmentation: boolean;
  private smoothing: number;
  private loadVision: () => Promise<Vision>;
  private engine: Promise<Engine> | null = null;
  private rigs = new Map<string, Promise<Rig>>();
  private fallback = new SimulationProvider();
  /** MediaPipe VIDEO mode wants strictly increasing timestamps for the life of a task, across our sessions. */
  private lastTs = 0;

  constructor(options: LocalPoseProviderOptions = {}) {
    this.assetsPath = options.assetsPath ?? "/models/mediapipe";
    this.segmentation = options.segmentation ?? true;
    this.smoothing = options.smoothing ?? 0.55;
    this.loadVision = options.loadVision ?? (() => import("@mediapipe/tasks-vision"));
  }

  get label() {
    return this.flavor === "tracking" ? copy.labels.tracking : copy.labels.silhouette;
  }

  /** Warm the runtime, the models and the rigs while the shopper reads the consent step. No camera, nothing beyond our own origin. */
  prepare(garments: Garment[]): void {
    void this.loadEngine().catch(() => {});
    for (const g of garments) void this.rig(g).catch(() => {});
  }

  private loadEngine(): Promise<Engine> {
    if (!this.engine) {
      this.engine = (async () => {
        const vision = await this.loadVision();
        const fileset = await vision.FilesetResolver.forVisionTasks(this.assetsPath);
        const create = async (delegate: "GPU" | "CPU"): Promise<Engine> => {
          const pose = await vision.PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: `${this.assetsPath}/${MODELS.pose}`, delegate },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          let seg: ImageSegmenter | null = null;
          let skinIndex = -1;
          if (this.segmentation) {
            try {
              seg = await vision.ImageSegmenter.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: `${this.assetsPath}/${MODELS.segmenter}`, delegate },
                runningMode: "VIDEO",
                outputCategoryMask: true,
                outputConfidenceMasks: false,
              });
              skinIndex = seg.getLabels().findIndex((l) => /body.?skin/i.test(l));
              if (skinIndex < 0) {
                seg.close();
                seg = null;
              }
            } catch {
              seg = null; // hands-in-front is a nicety; tracking still works without it
            }
          }
          return { pose, seg, skinIndex };
        };
        try {
          return await create("GPU");
        } catch {
          return await create("CPU");
        }
      })();
      this.engine.catch(() => {
        this.engine = null; // let a later attempt retry after a transient failure
      });
    }
    return this.engine;
  }

  private rig(g: Garment): Promise<Rig> {
    let p = this.rigs.get(g.id);
    if (!p) {
      p = (async () => {
        if (!g.parts || !g.anchors) throw new Error(`garment ${g.id} has no parts/anchors for the on-device tracker`);
        const { size } = g.parts;
        const load = async (key: string, part: GarmentPart | undefined, cols: number, rows: number): Promise<PartTex | null> => {
          if (!part) return null;
          const image = new Image();
          image.decoding = "async";
          image.src = part.file;
          await image.decode();
          return {
            key: `${g.id}:${key}`,
            image,
            frame: { origin: { x: part.x * size.w, y: part.y * size.h }, w: part.w * size.w, h: part.h * size.h },
            mesh: buildMesh(cols, rows),
          };
        };
        const [torso, sleeveL, sleeveR] = await Promise.all([
          load("torso", g.parts.torso, 12, 16),
          load("sleeveL", g.parts.sleeveL, 6, 20),
          load("sleeveR", g.parts.sleeveR, 6, 20),
        ]);
        if (!torso) throw new Error(`garment ${g.id} has no torso part`);
        return { id: g.id, w: size.w, h: size.h, anchors: g.anchors, sleeve: g.sleeve ?? "long", torso, sleeveL, sleeveR };
      })();
      this.rigs.set(g.id, p);
      p.catch(() => this.rigs.delete(g.id));
    }
    return p;
  }

  async connect(stream: MediaStream, o: ConnectOptions): Promise<TryOnSession> {
    const aborted = () => {
      if (o.signal?.aborted) throw new DOMException("try-on closed while connecting", "AbortError");
    };
    let engine: Engine;
    let current: Rig;
    try {
      engine = await this.loadEngine();
      aborted();
      current = await this.rig(o.initialGarment);
      aborted();
    } catch (err) {
      if ((err as { name?: string } | null)?.name === "AbortError") throw err;
      console.warn("[tryon] on-device tracking unavailable; using the silhouette placeholder.", err);
      this.flavor = "silhouette";
      return this.fallback.connect(stream, o);
    }
    this.flavor = "tracking";

    // A hidden <video> turns the camera stream into frames we can read. In the DOM: some mobile browsers throttle detached video.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    video.srcObject = stream;
    document.body.appendChild(video);
    const dropVideo = () => {
      video.pause();
      video.srcObject = null;
      video.remove();
    };
    await video.play().catch(() => {});
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        video.addEventListener("loadeddata", () => resolve(), { once: true });
        o.signal?.addEventListener("abort", () => resolve(), { once: true });
      });
    }
    if (o.signal?.aborted) {
      dropVideo();
      throw new DOMException("try-on closed while connecting", "AbortError");
    }
    const W = video.videoWidth || 1280;
    const H = video.videoHeight || 720;

    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d");
    let gl: GlMesh;
    try {
      if (!ctx) throw new Error("2d canvas unavailable");
      gl = new GlMesh(W, H);
    } catch (err) {
      console.warn("[tryon] WebGL unavailable; using the silhouette placeholder.", err);
      dropVideo();
      this.flavor = "silhouette";
      return this.fallback.connect(stream, o);
    }
    const upload = (rig: Rig) => {
      for (const part of [rig.torso, rig.sleeveL, rig.sleeveR]) if (part) gl.texture(part.key, part.image);
    };
    upload(current);

    // Segmentation runs on a small copy of the frame; the mask is scaled back up when compositing.
    const segW = SEG_WIDTH;
    const segH = Math.max(16, Math.round((segW * H) / W));
    const segCanvas = document.createElement("canvas");
    segCanvas.width = segW;
    segCanvas.height = segH;
    const segCtx = segCanvas.getContext("2d", { willReadFrequently: true });
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");
    const handsLayer = document.createElement("canvas");
    handsLayer.width = W;
    handsLayer.height = H;
    const handsCtx = handsLayer.getContext("2d");
    let maskReady = false;
    let maskData: ImageData | null = null;

    let previous: Rig | null = null;
    let fadeFrom = 0;
    let landmarks: Landmark[] | null = null;
    let lastSeen = 0;
    let hint: TrackingHint | null | undefined;
    const front = { L: false, R: false };
    let stopped = false;
    let raf = 0;
    let frame = 0;
    let live = false;
    let drawWarned = false;

    const setHint = (h: TrackingHint | null) => {
      if (h !== hint) {
        hint = h;
        o.onHint?.(h);
      }
    };
    const firstFrame = () => {
      if (!live) {
        live = true;
        o.onState("live");
      }
    };
    const nextTs = () => {
      const t = Math.max(Math.round(performance.now()), this.lastTs + 1);
      this.lastTs = t;
      return t;
    };
    const inFront = (key: "L" | "R", arm: ArmTargets) => {
      if (arm.depth === null) front[key] = false;
      else if (arm.depth < FRONT_ON) front[key] = true;
      else if (arm.depth > FRONT_OFF) front[key] = false;
      return front[key];
    };

    const drawRig = (rig: Rig, t: Ok, alpha: number) => {
      warpMesh(rig.torso.mesh, rig.torso.frame.w, rig.torso.frame.h, solveTps(t.torso.src, t.torso.dst), rig.torso.frame.origin);
      const sleeves: Array<{ part: PartTex; arm: ArmTargets; key: "L" | "R" }> = [];
      if (rig.sleeveL) sleeves.push({ part: rig.sleeveL, arm: t.arms.L, key: "L" });
      if (rig.sleeveR) sleeves.push({ part: rig.sleeveR, arm: t.arms.R, key: "R" });
      for (const s of sleeves) skinSleeve(s.part.mesh, s.part.frame, s.arm.src, s.arm.dst, s.arm.widthScale);
      const behind = sleeves.filter((s) => !inFront(s.key, s.arm));
      const ahead = sleeves.filter((s) => front[s.key]);
      for (const s of behind) gl.draw(s.part.mesh, s.part.key, alpha);
      gl.draw(rig.torso.mesh, rig.torso.key, alpha);
      for (const s of ahead) gl.draw(s.part.mesh, s.part.key, alpha);
    };

    const updateMask = (ts: number) => {
      if (!engine.seg || !segCtx || !maskCtx) return;
      segCtx.drawImage(video, 0, 0, segW, segH);
      try {
        const r = engine.seg.segmentForVideo(segCanvas, ts);
        const m = r.categoryMask;
        if (m) {
          const mw = m.width;
          const mh = m.height;
          if (!maskData || maskData.width !== mw || maskData.height !== mh) {
            maskCanvas.width = mw;
            maskCanvas.height = mh;
            maskData = maskCtx.createImageData(mw, mh);
            maskData.data.fill(255);
          }
          const cats = m.getAsUint8Array();
          const px = maskData.data;
          const skin = engine.skinIndex;
          for (let i = 0; i < cats.length; i++) px[i * 4 + 3] = cats[i] === skin ? 255 : 0;
          maskCtx.putImageData(maskData, 0, 0);
          maskReady = true;
        }
        r.close();
      } catch {
        /* a dropped segmentation frame is fine */
      }
    };

    const draw = () => {
      if (stopped) return;
      raf = requestAnimationFrame(draw);
      if (!ctx || video.readyState < 2) return;
      const now = performance.now();
      const ts = nextTs();
      frame++;

      // 1. pose
      let found: readonly Landmark[] | undefined;
      try {
        found = engine.pose.detectForVideo(video, ts).landmarks?.[0] as readonly Landmark[] | undefined;
      } catch {
        found = undefined;
      }
      if (found && found.length) {
        landmarks = smoothLandmarks(landmarks, found, this.smoothing);
        lastSeen = now;
      } else if (now - lastSeen > LOST_AFTER_MS) {
        landmarks = null;
      }

      // 2. camera frame
      ctx.drawImage(video, 0, 0, W, H);

      // 3. garment on the body
      const t = bodyTargets(current.anchors, current.w, current.h, landmarks, W, H, { sleeve: current.sleeve });
      if (!t.ok) {
        setHint(t.reason === "too-small" ? "too-far" : t.reason === "shoulders-hidden" ? "shoulders-hidden" : "no-person");
        firstFrame();
        return;
      }
      setHint(null);

      try {
        gl.clear();
        let fade = 1;
        if (previous) {
          fade = Math.min(1, (now - fadeFrom) / FADE_MS);
          if (fade >= 1) previous = null;
        }
        if (previous) {
          const tp = bodyTargets(previous.anchors, previous.w, previous.h, landmarks, W, H, { sleeve: previous.sleeve });
          if (tp.ok) drawRig(previous, tp, 1 - fade);
        }
        drawRig(current, t, fade);
        ctx.drawImage(gl.canvas, 0, 0);
      } catch (err) {
        // One bad frame must not become a silent camera-only session: say so once, keep going.
        if (!drawWarned) {
          drawWarned = true;
          console.warn("[tryon] garment draw failed", err);
        }
      }

      // 4. hands that are in front of the torso come back on top (skin pixels only, within a circle around each wrist)
      if (t.hands.length && engine.seg && handsCtx) {
        if (frame % 2 === 0 || !maskReady) updateMask(ts);
        if (maskReady) {
          handsCtx.globalCompositeOperation = "source-over";
          handsCtx.clearRect(0, 0, W, H);
          handsCtx.drawImage(video, 0, 0, W, H);
          handsCtx.globalCompositeOperation = "destination-in";
          handsCtx.drawImage(maskCanvas, 0, 0, W, H);
          ctx.save();
          ctx.beginPath();
          for (const h of t.hands) {
            ctx.moveTo(h.x + h.r, h.y);
            ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
          }
          ctx.clip();
          ctx.drawImage(handsLayer, 0, 0);
          ctx.restore();
        }
      }
      firstFrame();
    };

    const outStream = out.captureStream(30);
    o.onRemoteStream(outStream);
    draw();

    return {
      setGarment: async (g: Garment) => {
        const next = await this.rig(g);
        if (stopped || next === current) return;
        upload(next);
        previous = current;
        current = next;
        fadeFrom = performance.now();
      },
      disconnect: async () => {
        stopped = true;
        cancelAnimationFrame(raf);
        for (const track of outStream.getTracks()) track.stop();
        video.pause();
        video.srcObject = null;
        video.remove();
        gl.dispose();
        // The MediaPipe tasks stay loaded for the next session: creating them is the expensive part.
      },
    };
  }
}
