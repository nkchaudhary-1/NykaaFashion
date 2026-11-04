// DecartProvider against a fake SDK. These are the properties we can prove without a key.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_MODEL, DecartProvider } from "../src/components/tryon/providers/decart.ts";
import { TryOnProviderError } from "../src/components/tryon/providers/errors.ts";
import type { ConnectOptions } from "../src/components/tryon/types.ts";
import { garments, settle } from "./helpers.ts";

type Handler = (data: unknown) => void;

function fakeSdk(opts: { connectError?: unknown } = {}) {
  const calls = {
    clientOptions: null as null | { apiKeyProvider?: () => Promise<string> | string; apiKey?: string },
    connect: null as null | { stream: unknown; options: Record<string, unknown> },
    modelName: null as null | string,
    sets: [] as Array<Record<string, unknown>>,
    disconnects: 0,
  };
  const handlers = new Map<string, Handler>();
  let state = "connected";
  const rt = {
    set: async (input: Record<string, unknown>) => {
      calls.sets.push(input);
    },
    on: (name: string, fn: Handler) => handlers.set(name, fn),
    off: () => {},
    disconnect: () => {
      calls.disconnects++;
    },
    getConnectionState: () => state,
  };
  const sdk = {
    createDecartClient: (o: typeof calls.clientOptions) => {
      calls.clientOptions = o;
      return {
        realtime: {
          connect: async (stream: unknown, options: Record<string, unknown>) => {
            calls.connect = { stream, options };
            // The real SDK calls apiKeyProvider right before dialling.
            await (o?.apiKeyProvider as () => Promise<string>)();
            if (opts.connectError) throw opts.connectError;
            return rt;
          },
        },
      };
    },
    models: {
      realtime: (name: string) => {
        calls.modelName = name;
        return { name };
      },
    },
  };
  return {
    sdk: sdk as never,
    calls,
    emit: (name: string, data?: unknown) => handlers.get(name)?.(data),
    setState: (s: string) => (state = s),
    connectionChange: (s: string) => (calls.connect?.options.onConnectionChange as Handler)(s),
  };
}

function setup(over: { connectError?: unknown; fast?: boolean; model?: string; tokenStatus?: number; tokenBody?: unknown } = {}) {
  const fake = fakeSdk({ connectError: over.connectError });
  const fetched: Array<{ url: string; init?: RequestInit }> = [];
  const refs: string[] = [];
  const provider = new DecartProvider({
    fast: over.fast,
    model: over.model,
    loadSdk: async () => fake.sdk,
    loadReference: async (url) => {
      refs.push(url);
      return new Blob([`bytes of ${url}`], { type: "image/jpeg" });
    },
    fetchFn: (async (url: string, init?: RequestInit) => {
      fetched.push({ url: String(url), init });
      const status = over.tokenStatus ?? 200;
      return new Response(JSON.stringify(over.tokenBody ?? { apiKey: "ek_ephemeral", expiresAt: "soon" }), { status });
    }) as typeof fetch,
  });
  const events = { remote: 0, states: [] as string[], errors: [] as Array<{ kind: string }> };
  const options: ConnectOptions = {
    initialGarment: garments[0],
    onRemoteStream: () => events.remote++,
    onState: (s) => events.states.push(s),
    onError: (e) => events.errors.push(e),
  };
  return { fake, provider, fetched, refs, events, options };
}

describe("DecartProvider", () => {
  it("gets its token from OUR route on every connect — and never talks to Decart for it", async () => {
    const t = setup();
    await t.provider.connect({} as MediaStream, t.options);
    assert.equal(t.fetched.length, 1);
    assert.equal(t.fetched[0].url, "/api/token");
    assert.equal(t.fetched[0].init?.method, "POST");
    // The client is built with a provider function, never a literal key.
    assert.equal(typeof t.fake.calls.clientOptions?.apiKeyProvider, "function");
    assert.equal(t.fake.calls.clientOptions?.apiKey, undefined);
    // A second dial (reconnect) asks again, so a 60-second token is never reused stale.
    await t.fake.calls.clientOptions!.apiKeyProvider!();
    assert.equal(t.fetched.length, 2);
  });

  it("pins the model (never silently 'latest') and asks for 720p", async () => {
    const t = setup();
    await t.provider.connect({} as MediaStream, t.options);
    assert.equal(DEFAULT_MODEL, "lucy-vton-3.6");
    assert.equal(t.fake.calls.modelName, "lucy-vton-3.6");
    assert.equal(t.fake.calls.connect?.options.resolution, "720p");
    assert.equal("speed" in t.fake.calls.connect!.options, false, "fast mode is off by default");
  });

  it("honours an explicit model and the fast-mode lever", async () => {
    const t = setup({ model: "lucy-vton-3.5", fast: true });
    await t.provider.connect({} as MediaStream, t.options);
    assert.equal(t.fake.calls.modelName, "lucy-vton-3.5");
    assert.equal(t.fake.calls.connect?.options.speed, "fast");
  });

  it("dresses the person from the first frame: full prompt + image, enhance:false", async () => {
    const t = setup();
    await t.provider.connect({} as MediaStream, t.options);
    const init = t.fake.calls.connect?.options.initialState as { prompt: { text: string; enhance: boolean }; image: Blob };
    assert.equal(init.prompt.text, garments[0].prompt);
    assert.equal(init.prompt.enhance, false);
    assert.ok(init.image instanceof Blob);
  });

  it("setGarment sends the COMPLETE state every time: prompt, image and enhance:false", async () => {
    const t = setup();
    const session = await t.provider.connect({} as MediaStream, t.options);
    await session.setGarment(garments[1]);
    await session.setGarment(garments[2]);
    assert.equal(t.fake.calls.sets.length, 2);
    for (const [i, g] of [garments[1], garments[2]].entries()) {
      const sent = t.fake.calls.sets[i];
      assert.deepEqual(Object.keys(sent).sort(), ["enhance", "image", "prompt"], "set() replaces state — never send a subset");
      assert.equal(sent.prompt, g.prompt);
      assert.equal(sent.enhance, false);
      assert.ok(sent.image instanceof Blob);
    }
  });

  it("fetches each reference image once and reuses it", async () => {
    const t = setup();
    const session = await t.provider.connect({} as MediaStream, t.options);
    await session.setGarment(garments[1]);
    await session.setGarment(garments[1]);
    await session.setGarment(garments[0]);
    assert.deepEqual(t.refs.sort(), [garments[0].image, garments[1].image].sort());
  });

  it("reports live only once the server says it is generating", async () => {
    const t = setup();
    await t.provider.connect({} as MediaStream, t.options);
    t.fake.connectionChange("connecting");
    t.fake.connectionChange("connected");
    assert.ok(!t.events.states.includes("live"), "connected is not generating");
    t.fake.connectionChange("generating");
    assert.equal(t.events.states.at(-1), "live");
    t.fake.connectionChange("reconnecting");
    assert.equal(t.events.states.at(-1), "reconnecting");
    t.fake.connectionChange("disconnected");
    assert.equal(t.events.states.at(-1), "disconnected");
  });

  it("disconnect() tears down the SDK session and silences late callbacks", async () => {
    const t = setup();
    const session = await t.provider.connect({} as MediaStream, t.options);
    await session.disconnect();
    assert.equal(t.fake.calls.disconnects, 1);
    const before = t.events.states.length;
    t.fake.connectionChange("generating");
    t.fake.emit("error", new Error("late"));
    assert.equal(t.events.states.length, before);
    assert.equal(t.events.errors.length, 0);
  });

  it("maps SDK failures to kinds the panel can explain", async () => {
    const timeout = setup({ connectError: Object.assign(new Error("slow"), { code: "WEBRTC_TIMEOUT_ERROR" }) });
    await assert.rejects(timeout.provider.connect({} as MediaStream, timeout.options), (e: TryOnProviderError) => e.kind === "timeout");

    const dial = setup({ connectError: Object.assign(new Error("ice"), { code: "WEBRTC_ICE_ERROR" }) });
    await assert.rejects(dial.provider.connect({} as MediaStream, dial.options), (e: TryOnProviderError) => e.kind === "connect");

    const cap = setup({ connectError: new Error("Session Limit Reached") });
    await assert.rejects(cap.provider.connect({} as MediaStream, cap.options), (e: TryOnProviderError) => e.kind === "capacity");
  });

  it("a token route that fails or returns nothing is a 'token' error, not a hang", async () => {
    const down = setup({ tokenStatus: 503, tokenBody: { error: "not_configured" } });
    await assert.rejects(down.provider.connect({} as MediaStream, down.options), (e: TryOnProviderError) => e.kind === "token");

    const empty = setup({ tokenBody: {} });
    await assert.rejects(empty.provider.connect({} as MediaStream, empty.options), (e: TryOnProviderError) => e.kind === "token");
  });

  it("forwards runtime SDK errors and provider-ended sessions", async () => {
    const t = setup();
    await t.provider.connect({} as MediaStream, t.options);
    t.fake.emit("sessionEnded", { reason: "insufficient_credits" });
    t.fake.emit("sessionEnded", { reason: "session_limit" });
    assert.deepEqual(
      t.events.errors.map((e) => e.kind),
      ["ended", "capacity"],
    );
  });

  it("prepare() warms assets without connecting or minting a token", async () => {
    const t = setup();
    t.provider.prepare(garments);
    await settle();
    assert.equal(t.fetched.length, 0, "no token requested until a connect");
    assert.equal(t.fake.calls.connect, null);
    assert.equal(t.refs.length, garments.length);
  });
});
