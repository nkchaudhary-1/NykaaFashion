import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveConfig } from "../src/lib/config.ts";

describe("resolveConfig", () => {
  it("carries no secrets and no vendor settings: the only option is your own render server", () => {
    const c = resolveConfig({ DECART_API_KEY: "should-be-ignored", TRYON_MODE: "live", TRYON_PHOTO_URL: "http://pc:8000" });
    assert.deepEqual(Object.keys(c), ["photoUrl"]);
    assert.ok(!JSON.stringify(c).includes("should-be-ignored"));
  });
  it("photo mode is off unless TRYON_PHOTO_URL is a valid http(s) URL", () => {
    assert.equal(resolveConfig({}).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "not a url" }).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "ftp://pc:8000" }).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "http://192.168.1.50:8000/" }).photoUrl, "http://192.168.1.50:8000");
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "https://pc.local/render/" }).photoUrl, "https://pc.local/render");
  });
});
