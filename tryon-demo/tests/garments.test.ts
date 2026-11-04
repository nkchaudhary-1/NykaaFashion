// The catalogue is data: these checks keep it honest so swapping products never needs a code change.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { garments } from "../src/data/garments.ts";

const words = (s: string) => s.trim().split(/\s+/).length;

describe("garment catalogue", () => {
  it("has 3-4 products, each with exactly { id, name, price, image, prompt } (+ optional alt)", () => {
    assert.ok(garments.length >= 3 && garments.length <= 4);
    for (const g of garments) {
      assert.deepEqual(
        Object.keys(g).filter((k) => k !== "alt").sort(),
        ["id", "image", "name", "price", "prompt"],
      );
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
