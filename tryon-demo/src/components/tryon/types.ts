// Shared contracts for the <TryOn> component and its provider adapters.
// Plain erasable TypeScript (no enums, no parameter properties) so Node's test runner can import it directly.

/** One try-able product. Swap the catalogue by editing the data file; nothing else changes. */
export type Garment = {
  id: string;
  name: string;
  price: number;
  /** Garment-only reference image on a plain background, at least 512x512. Same-origin URL. */
  image: string;
  /** Pre-written prompt, 20-30 words, "substitute/add" pattern. Quality depends on it. */
  prompt: string;
  /** Alt text for the product image. Falls back to the name. */
  alt?: string;
  /**
   * For the on-device tracker: the garment cut into transparent parts (torso, sleeves; no backdrop, no hanger) and
   * the anchor points the warp pins to the body, as fractions of the full cutout. See scripts/make-cutouts.mjs.
   */
  parts?: GarmentParts;
  anchors?: GarmentAnchors;
  sleeve?: "long" | "short" | "none";
};

/** One transparent image and its box within the full cutout (fractions 0..1). */
export type GarmentPart = { file: string; x: number; y: number; w: number; h: number };
export type GarmentParts = {
  /** Nominal pixel size of the full cutout that the fractions refer to. */
  size: { w: number; h: number };
  torso: GarmentPart;
  sleeveL?: GarmentPart;
  sleeveR?: GarmentPart;
};

/** Fractions (0..1) of the full cutout. L/R = viewer's left/right, i.e. the wearer's right/left. */
export type GarmentAnchors = {
  neck: Point;
  shoulderL: Point;
  shoulderR: Point;
  sideL: Point;
  sideR: Point;
  hemL: Point;
  hemR: Point;
  /** Top of each sleeve (the cap apex): the sleeve pivots here. */
  sleeveTopL: Point;
  sleeveTopR: Point;
  elbowL: Point;
  elbowR: Point;
  cuffL: Point;
  cuffR: Point;
};
export type Point = { x: number; y: number };

/** What the on-device tracker needs from the shopper, shown by the panel as a hint. */
export type TrackingHint = "no-person" | "too-far" | "shoulders-hidden";

export type TryOnMode = "live" | "sim";

/** The panel lifecycle. Exactly the PRD's eight states. */
export type SessionState =
  | "idle"
  | "consent"
  | "requesting-permission"
  | "permission-denied"
  | "connecting"
  | "live"
  | "switching"
  | "error";

/** Why the camera could not be opened. Drives the permission-denied copy. */
export type PermissionReason = "denied" | "dismissed" | "no-camera" | "in-use" | "unsupported";

export type TryOnErrorKind =
  | "token" //        could not mint / fetch a client token (server env, key, network)
  | "connect" //      dial failed
  | "timeout" //      connecting took too long
  | "dropped" //      stream dropped or camera ended mid-session
  | "backgrounded" // tab was hidden; we tore down on purpose
  | "capacity" //     provider has no capacity / session limit
  | "ended" //        the provider ended the session on purpose (moderation, credits, policy)
  | "limit" //        our own session-length cap, there to bound per-second spend
  | "unknown";

export type TryOnError = { kind: TryOnErrorKind; message: string; cause?: unknown };

/** Connection health as the provider sees it. The panel lifecycle above is the controller's business, not the provider's. */
export type ProviderState = "connecting" | "live" | "reconnecting" | "disconnected";

export type ConnectionQuality = "good" | "fair" | "poor" | "critical";

export interface ConnectOptions {
  /** Sent as part of connecting, so the very first frame already shows a garment. */
  initialGarment: Garment;
  onRemoteStream: (stream: MediaStream) => void;
  onState: (state: ProviderState) => void;
  onQuality?: (quality: ConnectionQuality) => void;
  /** Tracking providers: what the shopper should do so the garment can be placed (null = all good). */
  onHint?: (hint: TrackingHint | null) => void;
  onError: (error: TryOnError) => void;
  /** Aborted when the shopper closes while connecting: stop at the next await, don't finish warming up. */
  signal?: AbortSignal;
}

export interface TryOnSession {
  /** Always sends the COMPLETE garment (prompt + image). Decart's set() replaces the whole state. */
  setGarment(garment: Garment): Promise<void>;
  /** Stops the stream. The caller owns, and stops, the camera tracks. */
  disconnect(): Promise<void>;
}

export interface TryOnProvider {
  readonly mode: TryOnMode;
  /** How the panel should label a not-live provider. Falls back to the generic "Simulation" badge. */
  readonly label?: { badge: string; tooltip: string };
  /** Optional warm-up (module + reference images). Must not open the camera or the network connection to the provider. */
  prepare?(garments: Garment[]): void;
  connect(stream: MediaStream, options: ConnectOptions): Promise<TryOnSession>;
}

export interface CameraService {
  /** Resolves with a live camera stream, or rejects with a CameraError. */
  acquire(): Promise<MediaStream>;
}

/** Analytics events — only the ones that answer a question (PRD "Analytics and success metrics"). */
export type TryOnEvent = { at: number; mode: TryOnMode } & (
  | { name: "tryon_clicked"; garmentId: string }
  | { name: "consent_shown"; garmentId: string }
  | { name: "consent_agreed" }
  | { name: "consent_declined" }
  | { name: "permission_granted" }
  | { name: "permission_denied"; reason: PermissionReason }
  | { name: "session_live"; ttffMs: number }
  | { name: "garment_switched"; garmentId: string; switchMs: number | null }
  | { name: "error_shown"; kind: TryOnErrorKind }
  | { name: "session_closed"; durationMs: number; reason: CloseReason }
);

export type CloseReason = "user" | "error" | "backgrounded" | "unmount" | "declined";

/** Non-blocking, transient message shown on the live panel. */
export type Notice = { kind: "switch-failed"; garmentId: string } | null;
