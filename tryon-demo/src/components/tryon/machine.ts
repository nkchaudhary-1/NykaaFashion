// The panel's lifecycle as a pure reducer. No timers, no DOM, no camera — the controller owns side effects and
// reacts to the transitions this table produces. Every row of the PRD's state-machine table lives here.
import type {
  CloseReason,
  ConnectionQuality,
  Notice,
  TrackingHint,
  PermissionReason,
  SessionState,
  TryOnError,
} from "./types.ts";

export interface MachineState {
  state: SessionState;
  /** The garment the shopper most recently asked for (the target). */
  garmentId: string | null;
  /** The garment currently rendered on the shopper. Null until the first frame. */
  appliedId: string | null;
  fullscreen: boolean;
  permissionReason: PermissionReason | null;
  error: TryOnError | null;
  notice: Notice;
  /** Reconnecting or otherwise degraded; the panel shows a hint instead of claiming live quality. */
  degraded: boolean;
  quality: ConnectionQuality | null;
  /** On-device tracking: what the shopper should do (step back, show shoulders). Null when the garment is placed. */
  hint: TrackingHint | null;
  /** Measured: connect -> first presented frame once the provider reports generating. */
  ttffMs: number | null;
  /** Measured: setGarment() sent -> first presented frame after the provider acknowledged it. */
  switchMs: number | null;
}

export const initialMachineState: MachineState = {
  state: "idle",
  garmentId: null,
  appliedId: null,
  fullscreen: false,
  permissionReason: null,
  error: null,
  notice: null,
  degraded: false,
  quality: null,
  hint: null,
  ttffMs: null,
  switchMs: null,
};

export type MachineEvent =
  | { type: "TRY_ON"; garmentId: string }
  | { type: "AGREE" }
  | { type: "DECLINE" }
  | { type: "CAMERA_OK" }
  | { type: "CAMERA_DENIED"; reason: PermissionReason }
  | { type: "RETRY" }
  | { type: "FIRST_FRAME"; ms: number; garmentId: string }
  | { type: "FAIL"; error: TryOnError }
  | { type: "SWITCH_DONE"; garmentId: string; ms: number | null }
  | { type: "SWITCH_FAILED"; garmentId: string; appliedId: string | null }
  | { type: "CLOSE"; reason?: CloseReason }
  | { type: "FULLSCREEN"; on: boolean }
  | { type: "DEGRADED"; on: boolean }
  | { type: "QUALITY"; quality: ConnectionQuality }
  | { type: "HINT"; hint: TrackingHint | null }
  | { type: "DISMISS_NOTICE" };

/** States in which the camera is on and a session exists (or is being set up). */
export const ACTIVE_STATES: readonly SessionState[] = ["connecting", "live", "switching"];
export const isActive = (s: SessionState): boolean => ACTIVE_STATES.includes(s);

/** Back to a blank idle panel. Nothing of a finished session survives a close. */
const reset = (): MachineState => initialMachineState;

export function reduce(s: MachineState, e: MachineEvent): MachineState {
  switch (e.type) {
    case "TRY_ON": {
      switch (s.state) {
        case "idle":
          return { ...s, state: "consent", garmentId: e.garmentId };
        case "live":
          // A second Try on while live is a garment switch, never a new session.
          if (e.garmentId === s.appliedId) return s.garmentId === e.garmentId ? s : { ...s, garmentId: e.garmentId };
          return { ...s, state: "switching", garmentId: e.garmentId, notice: null };
        case "switching":
          // Rapid switching: last selection wins.
          return s.garmentId === e.garmentId ? s : { ...s, garmentId: e.garmentId };
        default:
          // consent / requesting-permission / permission-denied / connecting / error:
          // remember the newest choice; the state itself does not move.
          return s.garmentId === e.garmentId ? s : { ...s, garmentId: e.garmentId };
      }
    }

    case "AGREE":
      return s.state === "consent" ? { ...s, state: "requesting-permission" } : s;

    case "DECLINE":
      return s.state === "consent" ? reset() : s;

    case "CAMERA_OK":
      return s.state === "requesting-permission"
        ? { ...s, state: "connecting", permissionReason: null, error: null, ttffMs: null, switchMs: null }
        : s;

    case "CAMERA_DENIED":
      // Also reachable from `connecting`: a Retry after a drop re-opens the camera there.
      return s.state === "requesting-permission" || s.state === "connecting"
        ? { ...s, state: "permission-denied", permissionReason: e.reason, fullscreen: false, degraded: false, quality: null }
        : s;

    case "RETRY":
      if (s.state === "permission-denied") return { ...s, state: "requesting-permission", permissionReason: null };
      if (s.state === "error")
        return { ...s, state: "connecting", error: null, appliedId: null, ttffMs: null, switchMs: null, notice: null };
      return s;

    case "FIRST_FRAME": {
      if (s.state !== "connecting") return s;
      // If the shopper picked something else while we were connecting, go straight into that switch.
      const target = s.garmentId ?? e.garmentId;
      return {
        ...s,
        state: target === e.garmentId ? "live" : "switching",
        garmentId: target,
        appliedId: e.garmentId,
        ttffMs: e.ms,
      };
    }

    case "FAIL":
      // Only an active session can fail. Late callbacks from a torn-down session are ignored.
      return isActive(s.state)
        ? { ...s, state: "error", error: e.error, fullscreen: false, degraded: false, quality: null, notice: null }
        : s;

    case "SWITCH_DONE": {
      if (s.state !== "switching") return s;
      const switchMs = e.ms ?? s.switchMs;
      // The shopper may have asked for something newer while this one was in flight; stay switching then.
      return e.garmentId === s.garmentId
        ? { ...s, state: "live", appliedId: e.garmentId, switchMs }
        : { ...s, appliedId: e.garmentId, switchMs };
    }

    case "SWITCH_FAILED":
      // A failed swap does not kill the session: fall back to what is still on screen and say so.
      return s.state === "switching"
        ? {
            ...s,
            state: "live",
            garmentId: e.appliedId ?? s.appliedId,
            appliedId: e.appliedId ?? s.appliedId,
            notice: { kind: "switch-failed", garmentId: e.garmentId },
          }
        : s;

    case "CLOSE":
      return s.state === "idle" ? s : reset();

    case "FULLSCREEN":
      if (!e.on) return s.fullscreen ? { ...s, fullscreen: false } : s;
      return s.state === "live" || s.state === "switching" ? (s.fullscreen ? s : { ...s, fullscreen: true }) : s;

    case "DEGRADED":
      return isActive(s.state) && s.degraded !== e.on ? { ...s, degraded: e.on } : s;

    case "QUALITY":
      return isActive(s.state) && s.quality !== e.quality ? { ...s, quality: e.quality } : s;

    case "HINT":
      return isActive(s.state) && s.hint !== e.hint ? { ...s, hint: e.hint } : s;

    case "DISMISS_NOTICE":
      return s.notice ? { ...s, notice: null } : s;
  }
}
