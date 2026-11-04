// Camera lifecycle helpers. The controller decides WHEN to open the camera (only after consent) and when to stop it.
import type { CameraService, PermissionReason } from "./types.ts";

export class CameraError extends Error {
  reason: PermissionReason;
  constructor(reason: PermissionReason, cause?: unknown) {
    super(`camera: ${reason}`);
    this.name = "CameraError";
    this.reason = reason;
    if (cause !== undefined) this.cause = cause;
  }
}

/** Match the realtime model: 1280x720 landscape, or 720x1280 on a portrait phone. Front camera. */
export function cameraConstraints(portrait: boolean): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: portrait ? 720 : 1280 },
      height: { ideal: portrait ? 1280 : 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  };
}

/** Map a getUserMedia failure to something the panel can explain. */
export function classifyCameraError(err: unknown): CameraError {
  if (err instanceof CameraError) return err;
  const e = err as { name?: string; message?: string } | null;
  const name = e?.name ?? "";
  const message = e?.message ?? "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      // Chromium words a closed-without-answering prompt as "Permission dismissed".
      return new CameraError(/dismiss/i.test(message) ? "dismissed" : "denied", err);
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return new CameraError("no-camera", err);
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return new CameraError("in-use", err);
    default:
      return new CameraError("denied", err);
  }
}

export const browserCamera: CameraService = {
  async acquire() {
    if (typeof window === "undefined" || !window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      // getUserMedia only exists on https:// or localhost.
      throw new CameraError("unsupported");
    }
    const portrait = window.matchMedia("(orientation: portrait)").matches && window.innerWidth < 768;
    try {
      return await navigator.mediaDevices.getUserMedia(cameraConstraints(portrait));
    } catch (err) {
      throw classifyCameraError(err);
    }
  },
};

/** Stop every track. Synchronous on purpose: the camera light must go off before anything else happens. */
export function stopStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      /* already stopped */
    }
  }
}
