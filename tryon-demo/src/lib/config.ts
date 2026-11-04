// Server-side configuration. Reads env at request time and returns ONLY non-secret values — this object is handed
// to client components. Hard rule for this project: no AI vendor, no API key. The only setting is your own server.
export type TryOnConfig = {
  /** Your own still-image render server (server/tryon_server.py), e.g. http://192.168.1.50:8000. Null = no photo mode. */
  photoUrl: string | null;
};

type Env = Record<string, string | undefined>;

export function resolveConfig(env: Env = process.env): TryOnConfig {
  let photoUrl: string | null = null;
  const raw = env.TRYON_PHOTO_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") photoUrl = u.origin + (u.pathname === "/" ? "" : u.pathname.replace(/\/+$/, ""));
    } catch {
      /* not a URL: photo mode stays off */
    }
  }
  return { photoUrl };
}
