// Server-side configuration. Reads env at request time and returns ONLY non-secret values — the shape
// below is what the page hands to client components, so it must never grow a key.
export const DEFAULT_MODEL = "lucy-vton-3.6";
export const DEFAULT_MAX_SESSION_SECONDS = 180;
const MAX_TOKEN_SESSION_SECONDS = 3600; // the SDK's own ceiling for token lifetimes/limits

export type TryOnConfig = {
  /** live only when a key is present AND the mode is not forced to sim. */
  mode: "live" | "sim";
  model: string;
  fast: boolean;
  /** 0 = no cap. Applied to the minted token and, in the panel, client-side. */
  maxSessionSeconds: number;
  /** Why we are in Simulation, for the README / logs. Null when live. */
  simReason: "no-key" | "forced" | null;
  /** Your own still-image render server (server/tryon_server.py), e.g. http://192.168.1.50:8000. Null = no photo mode. */
  photoUrl: string | null;
};

type Env = Record<string, string | undefined>;

const MODEL_PATTERN = /^lucy-vton-(\d+(\.\d+)*|latest)$/;

export function hasKey(env: Env = process.env): boolean {
  return Boolean(env.DECART_API_KEY?.trim());
}

export function resolveConfig(env: Env = process.env): TryOnConfig {
  const requested = env.TRYON_MODE?.trim().toLowerCase();
  const forcedSim = requested === "sim";
  const keyed = hasKey(env);
  const mode = keyed && !forcedSim ? "live" : "sim";

  const model = env.TRYON_MODEL?.trim() && MODEL_PATTERN.test(env.TRYON_MODEL.trim()) ? env.TRYON_MODEL.trim() : DEFAULT_MODEL;

  const rawCap = env.TRYON_MAX_SESSION_SECONDS?.trim();
  let maxSessionSeconds = DEFAULT_MAX_SESSION_SECONDS;
  if (rawCap !== undefined && rawCap !== "") {
    const n = Number.parseInt(rawCap, 10);
    if (Number.isFinite(n) && n >= 0) maxSessionSeconds = Math.min(n, MAX_TOKEN_SESSION_SECONDS);
  }

  let photoUrl: string | null = null;
  const rawPhoto = env.TRYON_PHOTO_URL?.trim();
  if (rawPhoto) {
    try {
      const u = new URL(rawPhoto);
      if (u.protocol === "http:" || u.protocol === "https:") photoUrl = u.origin + (u.pathname === "/" ? "" : u.pathname.replace(/\/+$/, ""));
    } catch {
      /* not a URL: photo mode stays off */
    }
  }

  return {
    mode,
    model,
    fast: env.TRYON_FAST?.trim() === "1",
    maxSessionSeconds,
    simReason: mode === "live" ? null : forcedSim ? "forced" : "no-key",
    photoUrl,
  };
}
