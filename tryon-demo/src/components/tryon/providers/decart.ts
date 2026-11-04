// DecartProvider — wraps @decartai/sdk (Lucy VTON realtime over WebRTC) behind the TryOnProvider interface.
//
// Documented flow (https://docs.platform.decart.ai, realtime Virtual Try-On):
//   1. our SERVER mints a short-lived client token from the permanent key  -> /api/token
//   2. the browser connects the camera stream to the model with that token  -> client.realtime.connect()
//   3. set({ prompt, image, enhance:false }) dresses the person; call again to switch garment, no reconnect
//
// The permanent key never reaches this file. The SDK is loaded lazily, so it never blocks page render and is
// never downloaded in Simulation mode.
import type { RealTimeModels } from "@decartai/sdk";
import type {
  ConnectOptions,
  ConnectionQuality,
  Garment,
  ProviderState,
  TryOnProvider,
  TryOnSession,
} from "../types.ts";
import { TryOnProviderError, toTryOnError } from "./errors.ts";
import { prepareReference } from "./reference.ts";

type SdkModule = typeof import("@decartai/sdk");

export const DEFAULT_MODEL = "lucy-vton-3.6";

export interface DecartProviderOptions {
  /** Our own route that mints ephemeral tokens. Default /api/token. */
  tokenEndpoint?: string;
  /** Pinned on purpose. "lucy-vton-latest" would silently change what you validated. */
  model?: string;
  /** speed:"fast" — lower connect latency, billed 2x. Off by default. */
  fast?: boolean;
  /** Injection points for tests. */
  loadSdk?: () => Promise<SdkModule>;
  loadReference?: (url: string) => Promise<Blob>;
  fetchFn?: typeof fetch;
}

const mapState = (s: string): ProviderState => {
  switch (s) {
    case "generating":
      return "live"; //         the server says it is rendering — this is the only state we call live
    case "reconnecting":
      return "reconnecting";
    case "disconnected":
      return "disconnected";
    default:
      return "connecting"; //   "connecting" and "connected" (connected is not yet generating)
  }
};

function classifySdkError(err: unknown) {
  if (err instanceof TryOnProviderError) return err;
  const e = err as { code?: unknown; message?: unknown } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  const message = typeof e?.message === "string" ? e.message : String(err);
  if (code === "TOKEN_CREATE_ERROR" || code === "INVALID_API_KEY") return new TryOnProviderError("token", message, err);
  if (code === "WEBRTC_TIMEOUT_ERROR") return new TryOnProviderError("timeout", message, err);
  if (/session limit|capacity/i.test(message)) return new TryOnProviderError("capacity", message, err);
  return new TryOnProviderError("connect", message, err);
}

export class DecartProvider implements TryOnProvider {
  readonly mode = "live" as const;
  private tokenEndpoint: string;
  private model: string;
  private fast: boolean;
  private loadSdk: () => Promise<SdkModule>;
  private loadReference: (url: string) => Promise<Blob>;
  private fetchFn: typeof fetch;
  private sdk: Promise<SdkModule> | null = null;
  private refs = new Map<string, Promise<Blob>>();

  constructor(options: DecartProviderOptions = {}) {
    this.tokenEndpoint = options.tokenEndpoint ?? "/api/token";
    this.model = options.model ?? DEFAULT_MODEL;
    this.fast = options.fast ?? false;
    this.loadSdk = options.loadSdk ?? (() => import("@decartai/sdk"));
    this.loadReference = options.loadReference ?? ((url) => prepareReference(url));
    this.fetchFn = options.fetchFn ?? ((...args) => fetch(...args));
  }

  /** Warm the SDK chunk and the reference images. Opens no camera and no connection to Decart. */
  prepare(garments: Garment[]): void {
    void this.sdkModule().catch(() => {});
    for (const g of garments) void this.reference(g).catch(() => {});
  }

  private sdkModule(): Promise<SdkModule> {
    if (!this.sdk) {
      this.sdk = this.loadSdk();
      this.sdk.catch(() => {
        this.sdk = null; // allow a retry after a network blip
      });
    }
    return this.sdk;
  }

  private reference(g: Garment): Promise<Blob> {
    let p = this.refs.get(g.id);
    if (!p) {
      p = this.loadReference(g.image);
      this.refs.set(g.id, p);
      p.catch(() => this.refs.delete(g.id));
    }
    return p;
  }

  /** Called by the SDK right before every connect and reconnect, so each carries a token minted for it. */
  private mintToken = async (): Promise<string> => {
    let res: Response;
    try {
      res = await this.fetchFn(this.tokenEndpoint, { method: "POST", cache: "no-store" });
    } catch (err) {
      throw new TryOnProviderError("token", "could not reach the token route", err);
    }
    if (!res.ok) throw new TryOnProviderError("token", `token route answered ${res.status}`);
    const body = (await res.json().catch(() => null)) as { apiKey?: unknown } | null;
    if (!body || typeof body.apiKey !== "string" || !body.apiKey) {
      throw new TryOnProviderError("token", "token route returned no token");
    }
    return body.apiKey;
  };

  async connect(stream: MediaStream, o: ConnectOptions): Promise<TryOnSession> {
    let closed = false;
    const guard =
      <A extends unknown[]>(fn: (...a: A) => void) =>
      (...a: A) => {
        if (!closed) fn(...a);
      };

    try {
      const sdk = await this.sdkModule();
      const client = sdk.createDecartClient({ apiKeyProvider: this.mintToken });
      const first = o.initialGarment;
      const image = await this.reference(first);

      const rt = await client.realtime.connect(stream, {
        model: sdk.models.realtime(this.model as RealTimeModels),
        resolution: "720p",
        ...(this.fast ? { speed: "fast" as const } : {}),
        onRemoteStream: guard(o.onRemoteStream),
        onConnectionChange: guard((s) => o.onState(mapState(s))),
        onConnectionQuality: guard((r) => o.onQuality?.(r.quality as ConnectionQuality)),
        // Full state from the first frame: prompt + image + enhance:false.
        initialState: { prompt: { text: first.prompt, enhance: false }, image },
      });

      rt.on(
        "error",
        guard((e) => o.onError(toTryOnError(classifySdkError(e)))),
      );
      rt.on(
        "sessionEnded",
        guard(({ reason }) =>
          o.onError({
            kind: reason === "session_limit" ? "capacity" : "ended",
            message: `session ended by the provider: ${reason}`,
          }),
        ),
      );
      // The state may already have moved on while connect() was resolving.
      o.onState(mapState(rt.getConnectionState()));

      return {
        // set() REPLACES the whole state — omitted fields are cleared. So every switch sends the
        // complete {prompt, image, enhance:false} for the target garment, never a partial update.
        setGarment: async (g: Garment) => {
          const ref = await this.reference(g);
          await rt.set({ prompt: g.prompt, image: ref, enhance: false });
        },
        disconnect: async () => {
          closed = true;
          try {
            rt.disconnect();
          } catch {
            /* already gone */
          }
        },
      };
    } catch (err) {
      closed = true;
      throw classifySdkError(err);
    }
  }
}
