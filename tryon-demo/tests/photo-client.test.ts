import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PhotoRenderError, createPhotoRenderer } from "../src/components/tryon/providers/photo/client.ts";

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"); // a PNG header: enough to be bytes
const b64 = (b: Buffer) => b.toString("base64");

function fakeFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return { fn, calls };
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("photo render client", () => {
  it("posts both images as base64 JSON with the category and defaults, and returns the PNG as a Blob", async () => {
    const f = fakeFetch(() => json(200, { image: b64(PNG), ms: 6200, model: "fashn-vton-1.5", size: [576, 864] }));
    const r = createPhotoRenderer("http://192.168.1.50:8000/", { fetchFn: f.fn });
    assert.equal(r.host, "192.168.1.50:8000");
    const person = new Blob([Buffer.from("person-jpeg-bytes")], { type: "image/jpeg" });
    const garment = new Blob([Buffer.from("garment-bytes")], { type: "image/webp" });
    const out = await r.render({ person, garment, category: "tops" });
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].url, "http://192.168.1.50:8000/tryon");
    assert.equal(f.calls[0].init.method, "POST");
    const body = JSON.parse(f.calls[0].init.body as string);
    assert.equal(Buffer.from(body.person, "base64").toString(), "person-jpeg-bytes");
    assert.equal(Buffer.from(body.garment, "base64").toString(), "garment-bytes");
    assert.equal(body.category, "tops");
    assert.equal(body.garment_photo_type, "flat-lay");
    assert.equal("steps" in body, false, "no steps unless asked");
    assert.equal(out.model, "fashn-vton-1.5");
    assert.equal(out.ms, 6200);
    assert.equal(out.width, 576);
    assert.equal(out.blob.type, "image/png");
    assert.equal(Buffer.from(await out.blob.arrayBuffer()).equals(PNG), true, "bytes round-trip");
  });

  it("passes steps, seed and the on-model photo type through when given", async () => {
    const f = fakeFetch(() => json(200, { image: b64(PNG), ms: 1, model: "mock", size: [1, 1] }));
    const r = createPhotoRenderer("http://pc:8000", { fetchFn: f.fn });
    await r.render({ person: new Blob([PNG]), garment: new Blob([PNG]), category: "one-pieces", garmentPhotoType: "model", steps: 20, seed: 7 });
    const body = JSON.parse(f.calls[0].init.body as string);
    assert.equal(body.garment_photo_type, "model");
    assert.equal(body.steps, 20);
    assert.equal(body.seed, 7);
    assert.equal(body.category, "one-pieces");
  });

  it("maps the server's answers to error kinds the panel can explain", async () => {
    const cases: Array<[Response, string]> = [
      [json(429, { error: "busy" }), "busy"],
      [json(503, { error: "model_not_installed", detail: "No module named fashn_vton" }), "not_installed"],
      [json(400, { error: "bad_request", detail: "category must be one of" }), "bad_request"],
      [json(500, { error: "render_failed", detail: "CUDA out of memory" }), "render_failed"],
      [new Response("<html>", { status: 502 }), "unknown"],
    ];
    for (const [res, kind] of cases) {
      const f = fakeFetch(() => res);
      const r = createPhotoRenderer("http://pc:8000", { fetchFn: f.fn });
      await assert.rejects(r.render({ person: new Blob([PNG]), garment: new Blob([PNG]), category: "tops" }), (e: PhotoRenderError) => e.kind === kind);
    }
  });

  it("a server that cannot be reached is 'unreachable', and carries the host in the message", async () => {
    const f = fakeFetch(() => {
      throw new TypeError("fetch failed");
    });
    const r = createPhotoRenderer("http://192.168.1.50:8000", { fetchFn: f.fn });
    await assert.rejects(r.render({ person: new Blob([PNG]), garment: new Blob([PNG]), category: "tops" }), (e: PhotoRenderError) => e.kind === "unreachable" && /192\.168\.1\.50:8000/.test(e.message));
  });

  it("times out instead of hanging, and a caller's own abort passes through untouched", async () => {
    const f = fakeFetch((_url, init) => new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new DOMException("aborted", "AbortError")))));
    const r = createPhotoRenderer("http://pc:8000", { fetchFn: f.fn, timeoutMs: 30 });
    await assert.rejects(r.render({ person: new Blob([PNG]), garment: new Blob([PNG]), category: "tops" }), (e: PhotoRenderError) => e.kind === "timeout");

    const ac = new AbortController();
    const slow = fakeFetch((_url, init) => new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const r2 = createPhotoRenderer("http://pc:8000", { fetchFn: slow.fn, timeoutMs: 10_000 });
    const p = r2.render({ person: new Blob([PNG]), garment: new Blob([PNG]), category: "tops" }, ac.signal);
    ac.abort();
    await assert.rejects(p, (e: Error) => e.name === "AbortError");
  });

  it("health reports the server's state", async () => {
    const f = fakeFetch(() => json(200, { ok: true, model: "fashn-vton-1.5", device: "cuda", ready: false, loading: true, busy: false, error: null }));
    const r = createPhotoRenderer("http://pc:8000", { fetchFn: f.fn });
    const h = await r.health();
    assert.equal(f.calls[0].url, "http://pc:8000/health");
    assert.equal(h.loading, true);
    assert.equal(h.device, "cuda");
  });
});
