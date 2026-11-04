// Two-bone skinning for a sleeve: shoulder → elbow → cuff. Each mesh vertex is expressed as (how far along the bone,
// how far to the side) in the garment image, then rebuilt on the tracked arm with the side offset scaled to the body.
// Rotation-safe (an arm raised 90° just rotates the sleeve), no fold-over, widths stay proportional.
import type { Mesh, Pt } from "./tps.ts";

/** Shoulder, elbow, cuff. */
export type Bone2 = { s: Pt; e: Pt; c: Pt };

export type PartFrame = { origin: Pt; w: number; h: number };

type Seg = { ax: number; ay: number; dx: number; dy: number; len: number; ux: number; uy: number };
const seg = (a: Pt, b: Pt): Seg => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1e-6;
  return { ax: a.x, ay: a.y, dx, dy, len, ux: dx / len, uy: dy / len };
};
const smoothstep = (t: number) => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** Place one point. Exported for tests. */
export function skinPoint(p: Pt, src: Bone2, dst: Bone2, scale: number, blend = 0.18): Pt {
  const s1 = seg(src.s, src.e);
  const s2 = seg(src.e, src.c);
  const d1 = seg(dst.s, dst.e);
  const d2 = seg(dst.e, dst.c);
  const B = Math.max(1e-6, blend * (s1.len + s2.len));

  // local coords on each source bone: t along (fraction), n to the side (px, signed)
  const rx1 = p.x - s1.ax;
  const ry1 = p.y - s1.ay;
  const t1 = (rx1 * s1.ux + ry1 * s1.uy) / s1.len;
  const n1 = s1.ux * ry1 - s1.uy * rx1;
  const rx2 = p.x - s2.ax;
  const ry2 = p.y - s2.ay;
  const t2 = (rx2 * s2.ux + ry2 * s2.uy) / s2.len;
  const n2 = s2.ux * ry2 - s2.uy * rx2;

  const along = t1 <= 1 ? t1 * s1.len : s1.len + t2 * s2.len;
  const w2 = smoothstep((along - (s1.len - B)) / (2 * B));

  const q1x = d1.ax + t1 * d1.dx - d1.uy * n1 * scale;
  const q1y = d1.ay + t1 * d1.dy + d1.ux * n1 * scale;
  const q2x = d2.ax + t2 * d2.dx - d2.uy * n2 * scale;
  const q2y = d2.ay + t2 * d2.dy + d2.ux * n2 * scale;
  return { x: q1x + (q2x - q1x) * w2, y: q1y + (q2y - q1y) * w2 };
}

/** Fill `mesh.pos` for a sleeve part whose grid covers `part` (in garment image px). */
export function skinSleeve(mesh: Mesh, part: PartFrame, src: Bone2, dst: Bone2, scale: number, blend = 0.18): void {
  const { uv, pos, vertexCount } = mesh;
  for (let i = 0; i < vertexCount; i++) {
    const p = { x: part.origin.x + uv[i * 2] * part.w, y: part.origin.y + uv[i * 2 + 1] * part.h };
    const q = skinPoint(p, src, dst, scale, blend);
    pos[i * 2] = q.x;
    pos[i * 2 + 1] = q.y;
  }
}
