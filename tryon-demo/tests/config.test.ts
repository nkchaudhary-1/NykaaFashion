import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_MAX_SESSION_SECONDS, DEFAULT_MODEL, resolveConfig } from "../src/lib/config.ts";

describe("resolveConfig — mode switch", () => {
  it("no key -> simulation (the default checked-out build needs no secret)", () => {
    const c = resolveConfig({});
    assert.equal(c.mode, "sim");
    assert.equal(c.simReason, "no-key");
  });
  it("a key -> live", () => {
    const c = resolveConfig({ DECART_API_KEY: "dct_test" });
    assert.equal(c.mode, "live");
    assert.equal(c.simReason, null);
  });
  it("a blank/whitespace key is not a key", () => {
    assert.equal(resolveConfig({ DECART_API_KEY: "   " }).mode, "sim");
    assert.equal(resolveConfig({ DECART_API_KEY: "" }).mode, "sim");
  });
  it("TRYON_MODE=sim forces simulation even with a key (no per-second billing)", () => {
    const c = resolveConfig({ DECART_API_KEY: "dct_test", TRYON_MODE: "sim" });
    assert.equal(c.mode, "sim");
    assert.equal(c.simReason, "forced");
  });
  it("TRYON_MODE=live without a key cannot be live — it never pretends", () => {
    assert.equal(resolveConfig({ TRYON_MODE: "live" }).mode, "sim");
  });
  it("is case-insensitive about the mode", () => {
    assert.equal(resolveConfig({ DECART_API_KEY: "dct_test", TRYON_MODE: "SIM" }).mode, "sim");
  });
});

describe("resolveConfig — secrets", () => {
  it("never carries the key (this object is handed to client components)", () => {
    const c = resolveConfig({ DECART_API_KEY: "dct_super_secret_value", TRYON_MODE: "live" });
    assert.ok(!JSON.stringify(c).includes("dct_super_secret_value"));
    assert.ok(!Object.keys(c).some((k) => /key|token|secret/i.test(k)));
  });
});

describe("resolveConfig — model and guardrails", () => {
  it("pins lucy-vton-3.6 by default, never silently 'latest'", () => {
    assert.equal(resolveConfig({}).model, "lucy-vton-3.6");
    assert.equal(DEFAULT_MODEL, "lucy-vton-3.6");
  });
  it("accepts a VTON model override and rejects anything else", () => {
    assert.equal(resolveConfig({ TRYON_MODEL: "lucy-vton-3.5" }).model, "lucy-vton-3.5");
    assert.equal(resolveConfig({ TRYON_MODEL: "lucy-vton-latest" }).model, "lucy-vton-latest");
    assert.equal(resolveConfig({ TRYON_MODEL: "lucy-2.1" }).model, DEFAULT_MODEL);
    assert.equal(resolveConfig({ TRYON_MODEL: "../../etc/passwd" }).model, DEFAULT_MODEL);
  });
  it("caps sessions at 180 s unless told otherwise; 0 turns the cap off; junk falls back to the default", () => {
    assert.equal(resolveConfig({}).maxSessionSeconds, DEFAULT_MAX_SESSION_SECONDS);
    assert.equal(resolveConfig({ TRYON_MAX_SESSION_SECONDS: "60" }).maxSessionSeconds, 60);
    assert.equal(resolveConfig({ TRYON_MAX_SESSION_SECONDS: "0" }).maxSessionSeconds, 0);
    assert.equal(resolveConfig({ TRYON_MAX_SESSION_SECONDS: "abc" }).maxSessionSeconds, DEFAULT_MAX_SESSION_SECONDS);
    assert.equal(resolveConfig({ TRYON_MAX_SESSION_SECONDS: "-5" }).maxSessionSeconds, DEFAULT_MAX_SESSION_SECONDS);
    assert.equal(resolveConfig({ TRYON_MAX_SESSION_SECONDS: "999999" }).maxSessionSeconds, 3600);
  });
  it("fast mode is off unless explicitly 1", () => {
    assert.equal(resolveConfig({}).fast, false);
    assert.equal(resolveConfig({ TRYON_FAST: "1" }).fast, true);
    assert.equal(resolveConfig({ TRYON_FAST: "true" }).fast, false);
  });
});

describe("resolveConfig — photo render server", () => {
  it("is off unless TRYON_PHOTO_URL is a valid http(s) URL", () => {
    assert.equal(resolveConfig({}).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "not a url" }).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "ftp://pc:8000" }).photoUrl, null);
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "http://192.168.1.50:8000/" }).photoUrl, "http://192.168.1.50:8000");
    assert.equal(resolveConfig({ TRYON_PHOTO_URL: "https://pc.local/render/" }).photoUrl, "https://pc.local/render");
  });
});
