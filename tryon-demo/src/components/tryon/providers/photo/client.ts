// Client for a still-image try-on render server (server/tryon_server.py on your own machine).
// Sends ONE camera photo plus the garment image, gets a rendered still back. Provider-agnostic shape, so any
// photo try-on service could sit behind it. Plain TypeScript, unit-tested in Node with a fake fetch.

export type GarmentCategory = "tops" | "bottoms" | "one-pieces";

export type PhotoHealth = {
  ok: boolean;
  model: string;
  device: string;
  ready: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
};

export type PhotoRenderInput = {
  person: Blob;
  garment: Blob;
  category: GarmentCategory;
  /** "flat-lay" for a product shot (our hanger images), "model" for an on-body photo. */
  garmentPhotoType?: "flat-lay" | "model";
  steps?: number;
  seed?: number;
};

export type PhotoRenderResult = { blob: Blob; ms: number; model: string; width: number; height: number };

export type PhotoErrorKind = "unreachable" | "busy" | "not_installed" | "bad_request" | "render_failed" | "timeout" | "unknown";

export class PhotoRenderError extends Error {
  kind: PhotoErrorKind;
  detail?: string;
  constructor(kind: PhotoErrorKind, message: string, detail?: string) {
    super(message);
    this.name = "PhotoRenderError";
    this.kind = kind;
    this.detail = detail;
  }
}

export interface PhotoRenderer {
  /** Where the photo goes, for the UI to say so (host:port of the server). */
  readonly host: string;
  health(signal?: AbortSignal): Promise<PhotoHealth>;
  render(input: PhotoRenderInput, signal?: AbortSignal): Promise<PhotoRenderResult>;
}

export interface PhotoRendererOptions {
  fetchFn?: typeof fetch;
  /** A render on a consumer GPU takes seconds; a cold model load adds more. Default 180 s. */
  timeoutMs?: number;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  return btoa(s);
}

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function createPhotoRenderer(url: string, options: PhotoRendererOptions = {}): PhotoRenderer {
  const base = url.replace(/\/+$/, "");
  const fetchFn = options.fetchFn ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const timeoutMs = options.timeoutMs ?? 180_000;
  let host = base;
  try {
    host = new URL(base).host;
  } catch {
    /* keep as given */
  }

  const withTimeout = (signal: AbortSignal | undefined, ms: number) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new DOMException("timed out", "TimeoutError")), ms);
    const onAbort = () => ac.abort(signal?.reason);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
    return { signal: ac.signal, done: () => clearTimeout(timer) };
  };

  const request = async (path: string, init: RequestInit, signal: AbortSignal | undefined, ms: number): Promise<Response> => {
    const t = withTimeout(signal, ms);
    try {
      // The caller may have aborted while the images were being encoded: don't even start the request.
      if (t.signal.aborted) throw t.signal.reason ?? new DOMException("aborted", "AbortError");
      return await fetchFn(`${base}${path}`, { ...init, signal: t.signal, cache: "no-store" });
    } catch (err) {
      if (signal?.aborted) throw err; // the caller cancelled: pass it through untouched
      const name = (err as { name?: string } | null)?.name;
      if (name === "TimeoutError" || (name === "AbortError" && !signal?.aborted)) {
        throw new PhotoRenderError("timeout", `no answer from ${host} in time`);
      }
      throw new PhotoRenderError("unreachable", `could not reach ${host}`, err instanceof Error ? err.message : String(err));
    } finally {
      t.done();
    }
  };

  return {
    host,

    async health(signal) {
      const res = await request("/health", { method: "GET" }, signal, 5_000);
      if (!res.ok) throw new PhotoRenderError("unknown", `health answered ${res.status}`);
      return (await res.json()) as PhotoHealth;
    },

    async render(input, signal) {
      const [person, garment] = await Promise.all([blobToBase64(input.person), blobToBase64(input.garment)]);
      const body = JSON.stringify({
        person,
        garment,
        category: input.category,
        garment_photo_type: input.garmentPhotoType ?? "flat-lay",
        ...(input.steps !== undefined ? { steps: input.steps } : {}),
        ...(input.seed !== undefined ? { seed: input.seed } : {}),
      });
      const res = await request("/tryon", { method: "POST", headers: { "Content-Type": "application/json" }, body }, signal, timeoutMs);
      const data = (await res.json().catch(() => null)) as { image?: string; ms?: number; model?: string; size?: [number, number]; error?: string; detail?: string } | null;
      if (!res.ok || !data || typeof data.image !== "string") {
        const detail = data?.detail;
        switch (data?.error ?? res.status) {
          case "busy":
          case 429:
            throw new PhotoRenderError("busy", `${host} is still rendering the last one`, detail);
          case "model_not_installed":
          case 503:
            throw new PhotoRenderError("not_installed", `${host} has no model installed`, detail);
          case "bad_request":
          case 400:
          case 413:
            throw new PhotoRenderError("bad_request", `${host} rejected the request`, detail);
          case "render_failed":
          case 500:
            throw new PhotoRenderError("render_failed", `render failed on ${host}`, detail);
          default:
            throw new PhotoRenderError("unknown", `${host} answered ${res.status}`, detail);
        }
      }
      return {
        blob: base64ToBlob(data.image, "image/png"),
        ms: typeof data.ms === "number" ? data.ms : 0,
        model: typeof data.model === "string" ? data.model : "unknown",
        width: data.size?.[0] ?? 0,
        height: data.size?.[1] ?? 0,
      };
    },
  };
}
