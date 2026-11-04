import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMesh, solveTps, warpMesh, type Pt } from "../src/components/tryon/providers/local/tps.ts";

const close = (a: Pt, b: Pt, eps = 1e-6) => Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;

describe("thin-plate spline warp", () => {
  it("passes exactly through every control point", () => {
    const src: Pt[] = [
      { x: 100, y: 50 },
      { x: 900, y: 50 },
      { x: 120, y: 1100 },
      { x: 880, y: 1100 },
      { x: 500, y: 20 },
      { x: 60, y: 600 },
      { x: 940, y: 600 },
    ];
    const dst: Pt[] = src.map((p, i) => ({ x: p.x * 0.4 + 200 + (i % 2) * 17, y: p.y * 0.35 + 90 - (i % 3) * 11 }));
    const f = solveTps(src, dst);
    for (let i = 0; i < src.length; i++) {
      assert.ok(close(f(src[i].x, src[i].y), dst[i], 1e-5), `control point ${i} not hit`);
    }
  });

  it("reproduces a pure affine map everywhere (bending terms vanish)", () => {
    const src: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 5, y: 5 },
    ];
    const affine = (p: Pt): Pt => ({ x: 2 * p.x - 0.5 * p.y + 3, y: 0.25 * p.x + 1.5 * p.y - 7 });
    const f = solveTps(src, src.map(affine));
    for (const p of [{ x: 2, y: 7 }, { x: 9.5, y: 1 }, { x: -3, y: 12 }, { x: 20, y: 20 }]) {
      assert.ok(close(f(p.x, p.y), affine(p), 1e-6), `affine not reproduced at ${JSON.stringify(p)}`);
    }
  });

  it("is smooth: a point between two controls lands between their targets", () => {
    const src: Pt[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ];
    // Right side pulled down: a sleeve following a lowered arm.
    const dst: Pt[] = [
      { x: 0, y: 0 },
      { x: 100, y: 40 },
      { x: 0, y: 100 },
      { x: 100, y: 140 },
    ];
    const f = solveTps(src, dst);
    const mid = f(50, 0);
    assert.ok(mid.y > 5 && mid.y < 35, `expected a gentle slope, got y=${mid.y}`);
    assert.ok(Math.abs(mid.x - 50) < 2);
  });

  it("regularisation trades exactness for smoothness, never explodes", () => {
    const src: Pt[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 50, y: 50 },
    ];
    const dst: Pt[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 50, y: 80 }, // a kink in the middle
    ];
    const exact = solveTps(src, dst, 0)(50, 50);
    const soft = solveTps(src, dst, 0.5)(50, 50);
    assert.ok(Math.abs(exact.y - 80) < 1e-6);
    assert.ok(soft.y > 50 && soft.y < 80, `soft solution should sit between, got ${soft.y}`);
  });

  it("rejects degenerate input", () => {
    assert.throws(() => solveTps([{ x: 0, y: 0 }], [{ x: 0, y: 0 }]));
    assert.throws(() => solveTps([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }], [{ x: 0, y: 0 }]));
  });
});

describe("mesh", () => {
  it("builds a grid with the right counts and consistent triangle winding", () => {
    const m = buildMesh(4, 3);
    assert.equal(m.vertexCount, 5 * 4);
    assert.equal(m.index.length, 4 * 3 * 6);
    assert.equal(m.uv[0], 0);
    assert.equal(m.uv[m.uv.length - 2], 1);
    assert.equal(m.uv[m.uv.length - 1], 1);
    // every index points at a real vertex
    for (const i of m.index) assert.ok(i < m.vertexCount);
  });

  it("warps every vertex through the map", () => {
    const m = buildMesh(2, 2);
    warpMesh(m, 200, 100, (x, y) => ({ x: x + 1000, y: y * 2 }));
    assert.equal(m.pos[0], 1000);
    assert.equal(m.pos[1], 0);
    assert.equal(m.pos[m.pos.length - 2], 1200);
    assert.equal(m.pos[m.pos.length - 1], 200);
  });
});
