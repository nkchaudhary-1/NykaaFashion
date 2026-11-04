// TryOnController — owns the camera, the provider session and every teardown path.
//
// The lifecycle itself is the pure reducer in machine.ts. This class turns transitions into side effects
// (open camera, connect, switch garment, tear down) and guards every async result with an `epoch` so a late
// result from a session that was already closed can never turn a camera back on or revive a UI state.
//
// Framework-free on purpose: it is unit-tested in Node with a fake camera and a fake provider, and the React
// component only subscribes to it (useSyncExternalStore).
import { CameraError, browserCamera, stopStream } from "./camera.ts";
import { initialMachineState, isActive, reduce, type MachineEvent, type MachineState } from "./machine.ts";
import { toTryOnError } from "./providers/errors.ts";
import type {
  CameraService,
  CloseReason,
  ConnectionQuality,
  Garment,
  ProviderState,
  TryOnEvent,
  TryOnProvider,
  TryOnSession,
} from "./types.ts";

export type TryOnSnapshot = MachineState & {
  /** The provider's output stream. Attached to a <video> from `connecting` onward. */
  remoteStream: MediaStream | null;
};

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface ControllerOptions {
  provider: TryOnProvider;
  /** Either pass a getter here (tests), or call configure({ garments }) after construction (the component does). */
  getGarments?: () => Garment[];
  camera?: CameraService;
  onEvent?: (event: TryOnEvent) => void;
  timers?: Timers;
  /** Monotonic clock (ms). Used for every latency figure. */
  now?: () => number;
  /** connecting -> error if no first frame by then. */
  connectTimeoutMs?: number;
  /** reconnecting -> error after this long. */
  reconnectGiveUpMs?: number;
  /** After a switch is acknowledged, wait this long for a frame before recording the figure anyway. */
  frameWaitMs?: number;
  /** Keep the "switching" state up at least this long so the swap reads as deliberate, not a glitch. */
  minSwitchingMs?: number;
  /** End the session after this long live (cost cap while testing). 0 = off. */
  maxSessionMs?: number;
}

const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export class TryOnController {
  private snap: TryOnSnapshot = { ...initialMachineState, remoteStream: null };
  private readonly serverSnap: TryOnSnapshot = this.snap;
  private listeners = new Set<() => void>();

  private provider: TryOnProvider;
  private garmentList: Garment[] = [];
  private getGarments: () => Garment[];
  private camera: CameraService;
  private onEvent?: (e: TryOnEvent) => void;
  private timers: Timers;
  private now: () => number;
  private connectTimeoutMs: number;
  private reconnectGiveUpMs: number;
  private frameWaitMs: number;
  private minSwitchingMs: number;
  private maxSessionMs: number;

  /** Bumped by every teardown. Any async work that captured an older value must discard its result. */
  private epoch = 0;
  private stream: MediaStream | null = null;
  private session: TryOnSession | null = null;
  private sessionP: Promise<TryOnSession | null> = Promise.resolve(null);
  private cameraStartedAt: number | null = null;
  private connectStartedAt = 0;
  private initialId: string | null = null;
  private applied: string | null = null;
  private providerLive = false;
  private frameSeen = false;
  private flushing = false;
  private frameWaiters: Array<() => void> = [];
  private connectTimer: unknown = null;
  private reconnectTimer: unknown = null;
  private capTimer: unknown = null;
  private abort: AbortController | null = null;

  constructor(options: ControllerOptions) {
    this.provider = options.provider;
    this.getGarments = options.getGarments ?? (() => this.garmentList);
    this.camera = options.camera ?? browserCamera;
    this.onEvent = options.onEvent;
    this.timers = options.timers ?? realTimers;
    this.now = options.now ?? (() => performance.now());
    // Live: WebRTC dial + first frame. On-device: first inference on a cold GPU can take a few seconds on weak hardware.
    this.connectTimeoutMs = options.connectTimeoutMs ?? 30_000;
    this.reconnectGiveUpMs = options.reconnectGiveUpMs ?? 10_000;
    this.frameWaitMs = options.frameWaitMs ?? 5_000;
    this.minSwitchingMs = options.minSwitchingMs ?? 450;
    this.maxSessionMs = options.maxSessionMs ?? 0;
  }

  // ── store contract (useSyncExternalStore) ──────────────────────────────────
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): TryOnSnapshot => this.snap;
  getServerSnapshot = (): TryOnSnapshot => this.serverSnap;

  get mode() {
    return this.provider.mode;
  }

  /** Latest props from the component. Called from an effect, so nothing here is read during render. */
  configure(config: { garments?: Garment[]; onEvent?: (event: TryOnEvent) => void }) {
    if (config.garments) this.garmentList = config.garments;
    if ("onEvent" in config) this.onEvent = config.onEvent;
  }

  // ── public actions ─────────────────────────────────────────────────────────
  tryOn(garmentId: string) {
    this.dispatch({ type: "TRY_ON", garmentId });
  }
  agree() {
    this.dispatch({ type: "AGREE" });
  }
  decline() {
    this.dispatch({ type: "DECLINE" });
  }
  retry() {
    this.dispatch({ type: "RETRY" });
  }
  close(reason: CloseReason = "user") {
    this.dispatch({ type: "CLOSE", reason });
  }
  setFullscreen(on: boolean) {
    this.dispatch({ type: "FULLSCREEN", on });
  }
  dismissNotice() {
    this.dispatch({ type: "DISMISS_NOTICE" });
  }

  /** The video element reports every presented frame. Cheap: it only resolves waiters and checks one flag. */
  notifyFrame() {
    if (this.frameWaiters.length) {
      const waiters = this.frameWaiters;
      this.frameWaiters = [];
      for (const w of waiters) w();
    }
    if (this.snap.state === "connecting" && !this.frameSeen) {
      this.frameSeen = true;
      if (this.providerLive) this.firstFrame();
    }
  }

  /** Browser lifecycle: a hidden tab or a closed page must not leave a live camera behind. */
  attach() {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.onPageHide);
  }
  detach() {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibility);
      window.removeEventListener("pagehide", this.onPageHide);
    }
    this.close("unmount");
  }
  /** A hidden tab pauses per-second spend and cannot leave a hidden live camera: tear down, offer Resume. */
  notifyHidden() {
    if (isActive(this.snap.state)) {
      this.dispatch({ type: "FAIL", error: { kind: "backgrounded", message: "tab was hidden" } });
    }
  }
  private onVisibility = () => {
    if (document.hidden) this.notifyHidden();
  };
  private onPageHide = () => this.close("unmount");

  // ── core ───────────────────────────────────────────────────────────────────
  private dispatch(e: MachineEvent) {
    const prev = this.snap;
    const next = reduce(prev, e);
    if (next === prev) return;
    this.snap = { ...next, remoteStream: prev.remoteStream };
    this.afterTransition(prev, this.snap, e);
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private emitEvent(e: { name: TryOnEvent["name"] } & Record<string, unknown>) {
    this.onEvent?.({ at: Date.now(), mode: this.provider.mode, ...e } as TryOnEvent);
  }

  private afterTransition(prev: TryOnSnapshot, next: TryOnSnapshot, e: MachineEvent) {
    // analytics — only events that answer a question
    switch (e.type) {
      case "TRY_ON":
        this.emitEvent({ name: "tryon_clicked", garmentId: e.garmentId });
        break;
      case "AGREE":
        this.emitEvent({ name: "consent_agreed" });
        break;
      case "DECLINE":
        this.emitEvent({ name: "consent_declined" });
        break;
      case "CAMERA_DENIED":
        this.emitEvent({ name: "permission_denied", reason: e.reason });
        break;
      case "FIRST_FRAME":
        this.emitEvent({ name: "session_live", ttffMs: e.ms });
        break;
      case "SWITCH_DONE":
        if (next.state === "live") this.emitEvent({ name: "garment_switched", garmentId: e.garmentId, switchMs: e.ms });
        break;
      case "FAIL":
        this.emitEvent({ name: "error_shown", kind: e.error.kind });
        break;
    }

    const entered = next.state !== prev.state ? next.state : null;

    if (entered === "consent") {
      this.emitEvent({ name: "consent_shown", garmentId: next.garmentId ?? "" });
      // Warm assets (SDK chunk, reference images). Opens neither the camera nor a provider connection.
      this.provider.prepare?.(this.getGarments());
    }
    if (entered === "requesting-permission") void this.startCamera();
    if (entered === "connecting") void this.startConnect();
    // The session clock starts at the first frame, whichever state that lands in (live, or straight into switching).
    if (e.type === "FIRST_FRAME" && this.maxSessionMs > 0) this.armCap(this.epoch);

    if (entered === "idle" || entered === "error" || entered === "permission-denied") {
      const reason: CloseReason =
        e.type === "CLOSE"
          ? (e.reason ?? "user")
          : e.type === "DECLINE"
            ? "declined"
            : e.type === "FAIL" && e.error.kind === "backgrounded"
              ? "backgrounded"
              : "error";
      this.teardown(reason);
    }

    // Entering switching, or changing the target while already switching, kicks the queue.
    if (next.state === "switching" && (entered === "switching" || prev.garmentId !== next.garmentId)) {
      void this.flush();
    }
  }

  private garment(id: string | null): Garment | undefined {
    return id ? this.getGarments().find((g) => g.id === id) : undefined;
  }

  // ── camera ─────────────────────────────────────────────────────────────────
  private adoptCamera(stream: MediaStream, epoch: number) {
    this.stream = stream;
    this.cameraStartedAt = this.now();
    for (const track of stream.getVideoTracks()) {
      // Fires when the device is unplugged or the OS revokes access — not when WE call stop().
      track.addEventListener("ended", () => {
        if (epoch === this.epoch) {
          this.dispatch({ type: "FAIL", error: { kind: "dropped", message: "camera track ended" } });
        }
      });
    }
    this.emitEvent({ name: "permission_granted" });
  }

  private async startCamera() {
    const epoch = this.epoch;
    try {
      const stream = await this.camera.acquire();
      if (epoch !== this.epoch) {
        // Closed while the permission prompt was open, then allowed anyway: switch it straight back off.
        stopStream(stream);
        return;
      }
      this.adoptCamera(stream, epoch);
      this.dispatch({ type: "CAMERA_OK" });
    } catch (err) {
      if (epoch !== this.epoch) return;
      const reason = err instanceof CameraError ? err.reason : "denied";
      this.dispatch({ type: "CAMERA_DENIED", reason });
    }
  }

  // ── connect ────────────────────────────────────────────────────────────────
  private async startConnect() {
    const epoch = this.epoch;
    const garment = this.garment(this.snap.garmentId);
    this.connectStartedAt = this.now();
    this.providerLive = false;
    this.frameSeen = false;
    this.applied = null;
    this.initialId = garment?.id ?? null;
    this.armConnectTimeout(epoch);

    const guard =
      <A extends unknown[]>(fn: (...a: A) => void) =>
      (...a: A) => {
        if (epoch === this.epoch) fn(...a);
      };

    try {
      if (!garment) throw new Error("no garment selected");
      if (!this.stream) {
        // Retry after a drop: the camera was stopped at teardown, so open it again (no prompt if still allowed).
        const stream = await this.camera.acquire();
        if (epoch !== this.epoch) {
          stopStream(stream);
          return;
        }
        this.adoptCamera(stream, epoch);
      }
      this.abort = typeof AbortController === "function" ? new AbortController() : null;
      const pending = this.provider.connect(this.stream as MediaStream, {
        initialGarment: garment,
        signal: this.abort?.signal,
        onRemoteStream: guard((s) => {
          this.snap = { ...this.snap, remoteStream: s };
          this.emit();
        }),
        onState: guard((s) => this.onProviderState(s)),
        onQuality: guard((q) => this.dispatchQuality(q)),
        onHint: guard((h) => this.dispatch({ type: "HINT", hint: h })),
        onError: guard((error) => this.dispatch({ type: "FAIL", error })),
      });
      this.sessionP = pending.catch(() => null);
      const session = await pending;
      if (epoch !== this.epoch) {
        await session.disconnect().catch(() => {});
        return;
      }
      this.session = session;
    } catch (err) {
      if (epoch !== this.epoch) return;
      if (err instanceof CameraError) {
        this.dispatch({ type: "CAMERA_DENIED", reason: err.reason });
      } else {
        this.dispatch({ type: "FAIL", error: toTryOnError(err) });
      }
    }
  }

  private dispatchQuality(q: ConnectionQuality) {
    this.dispatch({ type: "QUALITY", quality: q });
  }

  private onProviderState(s: ProviderState) {
    switch (s) {
      case "live":
        this.providerLive = true;
        this.clearTimer("reconnectTimer");
        this.dispatch({ type: "DEGRADED", on: false });
        if (this.snap.state === "connecting" && this.frameSeen) this.firstFrame();
        break;
      case "reconnecting": {
        this.dispatch({ type: "DEGRADED", on: true });
        if (this.reconnectTimer === null) {
          const epoch = this.epoch;
          this.reconnectTimer = this.timers.set(() => {
            this.reconnectTimer = null;
            if (epoch === this.epoch) {
              this.dispatch({ type: "FAIL", error: { kind: "dropped", message: "reconnect gave up" } });
            }
          }, this.reconnectGiveUpMs);
        }
        break;
      }
      case "disconnected":
        this.dispatch({
          type: "FAIL",
          error:
            this.snap.state === "connecting"
              ? { kind: "connect", message: "disconnected while connecting" }
              : { kind: "dropped", message: "stream dropped" },
        });
        break;
      case "connecting":
        break;
    }
  }

  private firstFrame() {
    if (this.initialId === null) return;
    this.clearTimer("connectTimer");
    // What is on screen is the garment we connected with. Set before dispatching: if the shopper already chose
    // something else, the transition into `switching` starts a flush that compares against this.
    this.applied = this.initialId;
    this.dispatch({ type: "FIRST_FRAME", ms: this.now() - this.connectStartedAt, garmentId: this.initialId });
  }

  private armConnectTimeout(epoch: number) {
    this.clearTimer("connectTimer");
    this.connectTimer = this.timers.set(() => {
      this.connectTimer = null;
      if (epoch === this.epoch && this.snap.state === "connecting") {
        this.dispatch({ type: "FAIL", error: { kind: "timeout", message: "no first frame in time" } });
      }
    }, this.connectTimeoutMs);
  }

  private armCap(epoch: number) {
    this.clearTimer("capTimer");
    this.capTimer = this.timers.set(() => {
      this.capTimer = null;
      if (epoch === this.epoch) {
        this.dispatch({ type: "FAIL", error: { kind: "limit", message: "session length cap reached" } });
      }
    }, this.maxSessionMs);
  }

  private clearTimer(name: "connectTimer" | "reconnectTimer" | "capTimer") {
    const h = this[name];
    if (h !== null) {
      this.timers.clear(h);
      this[name] = null;
    }
  }

  // ── garment switching ──────────────────────────────────────────────────────
  // Leading-edge queue: the first request goes out immediately; anything asked for while it is in flight
  // collapses to the newest choice (last selection wins). Every send is the COMPLETE garment — never a partial
  // update. The camera is never touched.
  private async flush() {
    if (this.flushing) return;
    this.flushing = true;
    const epoch = this.epoch;
    let lastMs: number | null = null;
    let attempting: string | null = null;
    const startedWaiting = this.now();
    try {
      const session = await this.sessionP;
      if (!session || epoch !== this.epoch) return;
      for (;;) {
        if (epoch !== this.epoch) return;
        const targetId = this.snap.garmentId;
        if (!targetId || targetId === this.applied) break;
        const target = this.garment(targetId);
        attempting = targetId;
        if (!target) throw new Error(`unknown garment ${targetId}`);
        const t0 = this.now();
        await session.setGarment(target);
        if (epoch !== this.epoch) return;
        this.applied = targetId;
        await this.waitForFrame(epoch);
        lastMs = this.now() - t0;
      }
      if (epoch !== this.epoch) return;
      const pad = this.minSwitchingMs - (this.now() - startedWaiting);
      if (pad > 0) await new Promise<void>((resolve) => this.timers.set(resolve, pad));
      if (epoch !== this.epoch) return;
      this.dispatch({ type: "SWITCH_DONE", garmentId: this.applied as string, ms: lastMs });
    } catch {
      if (epoch !== this.epoch) return;
      // Fall back to the last garment the provider acknowledged, which is what is actually on screen.
      this.dispatch({
        type: "SWITCH_FAILED",
        garmentId: attempting ?? this.snap.garmentId ?? "",
        appliedId: this.applied,
      });
    } finally {
      this.flushing = false;
      // The shopper may have chosen again in the instant between the loop ending and now.
      if (epoch === this.epoch && this.snap.state === "switching" && this.snap.garmentId !== this.applied) {
        void this.flush();
      }
    }
  }

  private waitForFrame(epoch: number): Promise<void> {
    return new Promise<void>((resolve) => {
      let done = false;
      let timer: unknown = null;
      const finish = () => {
        if (done) return;
        done = true;
        if (timer !== null) this.timers.clear(timer);
        resolve();
      };
      this.frameWaiters.push(finish);
      timer = this.timers.set(finish, this.frameWaitMs);
      if (epoch !== this.epoch) finish();
    });
  }

  // ── teardown ───────────────────────────────────────────────────────────────
  // Order matters: invalidate async work, stop the camera tracks SYNCHRONOUSLY (the light goes off first),
  // then disconnect the session. Idempotent.
  private teardown(reason: CloseReason) {
    this.epoch++;
    this.abort?.abort();
    this.abort = null;
    this.clearTimer("connectTimer");
    this.clearTimer("reconnectTimer");
    this.clearTimer("capTimer");

    const waiters = this.frameWaiters;
    this.frameWaiters = [];
    for (const w of waiters) w();

    const hadCamera = this.stream !== null;
    const startedAt = this.cameraStartedAt;
    stopStream(this.stream);
    this.stream = null;
    this.cameraStartedAt = null;

    const session = this.session;
    this.session = null;
    this.sessionP = Promise.resolve(null);
    if (session) void session.disconnect().catch(() => {});

    this.flushing = false;
    this.applied = null;
    this.initialId = null;
    this.providerLive = false;
    this.frameSeen = false;
    this.snap = { ...this.snap, remoteStream: null };

    if (hadCamera && startedAt !== null) {
      this.emitEvent({ name: "session_closed", durationMs: Math.round(this.now() - startedAt), reason });
    }
  }
}
