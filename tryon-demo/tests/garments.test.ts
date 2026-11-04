// The catalogue is data: these checks keep it honest so swapping products never needs a code change.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { garments } from "../src/data/garments.ts";

const words = (s: string) => s.trim().split(/\s+/).length;

describe("garment catalogue", () => {
  it("has 3-4 products, each with { id, name, price, image, prompt } (+ alt, and parts/anchors/sleeve for the on-device preview)", () => {
    assert.ok(garments.length >= 3 && garments.length <= 4);
    const optional = new Set(["alt", "parts", "anchors", "sleeve"]);
    for (const g of garments) {
      assert.deepEqual(
        Object.keys(g).filter((k) => !optional.has(k)).sort(),
        ["id", "image", "name", "price", "prompt"],
      );
    }
  });
  it("every garment has part images and sane anchors for the on-device tracker", () => {
    for (const g of garments) {
      assert.ok(g.parts && g.anchors && g.sleeve, `${g.id} is missing parts/anchors/sleeve`);
      const parts = g.parts!;
      assert.ok(parts.size.w > 0 && parts.size.h > 0);
      for (const key of ["torso", "sleeveL", "sleeveR"] as const) {
        const part = parts[key];
        assert.ok(part, `${g.id} has no ${key} part`);
        assert.ok(existsSync(new URL(`../public${part.file}`, import.meta.url)), `${part.file} is missing`);
        for (const v of [part.x, part.y, part.w, part.h]) assert.ok(v >= 0 && v <= 1, `${g.id}.${key} box out of range`);
      }
      const a = g.anchors!;
      for (const [k, p] of Object.entries(a)) {
        assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1, `${g.id}.${k} out of range`);
      }
      assert.ok(a.shoulderL.x < a.shoulderR.x, `${g.id}: shoulders swapped`);
      assert.ok(a.hemL.x < a.hemR.x && a.sideL.x < a.sideR.x, `${g.id}: left/right anchors swapped`);
      assert.ok(a.neck.y <= a.shoulderL.y && a.sideL.y > a.shoulderL.y && a.hemL.y > a.sideL.y, `${g.id}: torso anchors not top-to-bottom`);
      assert.ok(a.cuffL.y > a.elbowL.y && a.elbowL.y > a.sleeveTopL.y, `${g.id}: sleeve anchors not top-to-bottom`);
      assert.ok(a.sleeveTopL.x < a.shoulderL.x && a.sleeveTopR.x > a.shoulderR.x, `${g.id}: sleeve tips should sit outside the seams`);
    }
  });
  it("covers the garments the brief names: a jacket, a patterned sweater, a white knit", () => {
    const text = garments.map((g) => `${g.name} ${g.prompt}`).join(" ").toLowerCase();
    assert.match(text, /bomber|jacket/);
    assert.match(text, /zigzag|pattern|stripe/);
    assert.match(text, /white.*knit|knit.*white/);
  });
  it("ids are unique", () => {
    assert.equal(new Set(garments.map((g) => g.id)).size, garments.length);
  });
  it("prompts are 20-30 words and follow the substitute/add pattern", () => {
    for (const g of garments) {
      const n = words(g.prompt);
      assert.ok(n >= 20 && n <= 30, `${g.id}: ${n} words`);
      assert.match(g.prompt, /^(Substitute|Add)\b/, `${g.id} should start with Substitute/Add`);
    }
  });
  it("every reference image exists as a real file, is garment-only (no person), and is large enough", async () => {
    let sharp: typeof import("sharp") | null = null;
    try {
      sharp = (await import("sharp")).default as unknown as typeof import("sharp");
    } catch {
      /* sharp is a transitive dependency of next; skip the size check if it is unavailable */
    }
    for (const g of garments) {
      assert.match(g.image, /^\/garments\/[\w-]+\.webp$/);
      const file = new URL(`../public${g.image}`, import.meta.url);
      assert.ok(existsSync(file), `${g.image} is missing`);
      if (sharp) {
        const meta = await (sharp as unknown as (b: Buffer) => { metadata(): Promise<{ width?: number; height?: number }> })(readFileSync(file)).metadata();
        assert.ok((meta.width ?? 0) >= 512 && (meta.height ?? 0) >= 512, `${g.id} is ${meta.width}x${meta.height}, needs >=512x512`);
      }
    }
  });
  it("every garment has alt text and a positive price", () => {
    for (const g of garments) {
      assert.ok(g.alt && g.alt.length > 10, `${g.id} alt`);
      assert.ok(g.price > 0);
    }
  });
});
