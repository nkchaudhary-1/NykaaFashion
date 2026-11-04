// SimulationProvider — the no-key development and review mode.
//
// What it IS: the shopper's own camera, composited locally onto a canvas, with a deliberately crude garment-shaped
// placeholder (the garment's real fabric swatch inside a fixed silhouette, dashed outline) that does NOT track the body.
// What it is NOT: AI fit or drape. The panel labels it "Simulation" the whole time; this file never claims otherwise.
//
// Privacy: this provider makes no network request with camera frames — nothing but a same-origin garment image.
// If that ever stops being true, the "stays in this browser tab" copy in copy.ts must change with it.
import type { ConnectOptions, Garment, TryOnProvider, TryOnSession } from "../types.ts";

type Swatch = HTMLCanvasElement;

const FADE_MS = 280;

async function loadSwatch(url: string): Promise<Swatch> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  // The middle of the garment photo is fabric: no hanger, no backdrop, no edge.
  const sx = img.naturalWidth * 0.34;
  const sy = img.naturalHeight * 0.5;
  const sw = img.naturalWidth * 0.32;
  const sh = img.naturalHeight * 0.2;
  const tile = document.createElement("canvas");
  tile.width = 256;
  tile.height = Math.max(1, Math.round((256 * sh) / sw));
  tile.getContext("2d")?.drawImage(img, sx, sy, sw, sh, 0, 0, tile.width, tile.height);
  return tile;
}

/** A fixed shoulders-and-torso shape, sized from the frame. Not fitted to anybody. */
function silhouette(w: number, h: number) {
  const S = Math.min(h, w * 0.9);
  const cx = w / 2;
  const neckY = h * 0.6;
  const shY = h * 0.645;
  const bottom = h + 0.05 * S;
  const neck = 0.075 * S;
  const shoulder = 0.3 * S;
  const outer = 0.46 * S;
  const body = new Path2D();
  body.moveTo(cx - neck, neckY);
  body.quadraticCurveTo(cx, neckY + 0.06 * S, cx + neck, neckY);
  body.lineTo(cx + shoulder, shY);
  body.quadraticCurveTo(cx + 0.42 * S, shY + 0.12 * S, cx + outer, bottom);
  body.lineTo(cx - outer, bottom);
  body.quadraticCurveTo(cx - 0.42 * S, shY + 0.12 * S, cx - shoulder, shY);
  body.closePath();
  const seams = new Path2D();
  for (const side of [-1, 1]) {
    seams.moveTo(cx + side * (shoulder - 0.02 * S), shY + 0.02 * S);
    seams.quadraticCurveTo(cx + side * 0.27 * S, shY + 0.14 * S, cx + side * 0.25 * S, bottom);
  }
  return { body, seams, neckY, neck, S, cx, shY };
}

export class SimulationProvider implements TryOnProvider {
  readonly mode = "sim" as const;
  private swatches = new Map<string, Promise<Swatch>>();

  prepare(garments: Garment[]): void {
    for (const g of garments) void this.swatch(g).catch(() => {});
  }

  private swatch(g: Garment): Promise<Swatch> {
    let p = this.swatches.get(g.id);
    if (!p) {
      p = loadSwatch(g.image);
      this.swatches.set(g.id, p);
      p.catch(() => this.swatches.delete(g.id));
    }
    return p;
  }

  async connect(stream: MediaStream, o: ConnectOptions): Promise<TryOnSession> {
    // A hidden <video> turns the camera stream into frames we can draw. Attached to the DOM because some
    // mobile browsers throttle detached video.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    video.srcObject = stream;
    document.body.appendChild(video);
    await video.play().catch(() => {});
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        video.addEventListener("loadeddata", () => resolve(), { once: true });
        o.signal?.addEventListener("abort", () => resolve(), { once: true });
      });
    }
    if (o.signal?.aborted) {
      video.pause();
      video.srcObject = null;
      video.remove();
      throw new DOMException("try-on closed while connecting", "AbortError");
    }

    const longEdge = 1280;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const k = Math.min(1, longEdge / Math.max(vw, vh));
    const w = Math.round(vw * k);
    const h = Math.round(vh * k);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas unavailable");
    const shape = silhouette(w, h);

    let current: Swatch = await this.swatch(o.initialGarment);
    let previous: Swatch | null = null;
    let fadeFrom = 0;
    let stopped = false;
    let raf = 0;

    const fill = (sw: Swatch, alpha: number) => {
      const pattern = ctx.createPattern(sw, "repeat");
      if (!pattern || alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pattern;
      ctx.fill(shape.body);
      ctx.restore();
    };

    const draw = (now: number) => {
      if (stopped) return;
      ctx.drawImage(video, 0, 0, w, h);

      let t = 1;
      if (previous) {
        t = Math.min(1, (now - fadeFrom) / FADE_MS);
        if (t >= 1) previous = null;
      }
      if (previous) fill(previous, 0.92 * (1 - t));
      fill(current, 0.92 * t);

      // Shading + seams so it reads as a garment shape, not a flat blob.
      const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.22)");
      ctx.save();
      ctx.fillStyle = g;
      ctx.fill(shape.body);
      ctx.lineWidth = Math.max(1.5, shape.S * 0.004);
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.stroke(shape.seams);
      // Obviously-approximate: dashed outline in the open.
      ctx.setLineDash([shape.S * 0.02, shape.S * 0.015]);
      ctx.lineWidth = Math.max(2, shape.S * 0.005);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke(shape.body);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    draw(performance.now());
    const out = canvas.captureStream(30);
    o.onRemoteStream(out);
    o.onState("live");

    return {
      setGarment: async (g: Garment) => {
        const next = await this.swatch(g);
        if (stopped || next === current) return;
        previous = current;
        current = next;
        fadeFrom = performance.now();
      },
      disconnect: async () => {
        stopped = true;
        cancelAnimationFrame(raf);
        for (const track of out.getTracks()) track.stop();
        video.pause();
        video.srcObject = null;
        video.remove();
      },
    };
  }
}
