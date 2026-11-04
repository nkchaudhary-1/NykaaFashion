// Fakes for testing the controller and providers in Node: no DOM, no camera, no network.
import { CameraError } from "../src/components/tryon/camera.ts";
import type { Timers } from "../src/components/tryon/controller.ts";
import type {
  CameraService,
  ConnectOptions,
  Garment,
  PermissionReason,
  TryOnEvent,
  TryOnProvider,
  TryOnSession,
} from "../src/components/tryon/types.ts";

export const garments: Garment[] = ["a", "b", "c", "d"].map((id) => ({
  id,
  name: `Garment ${id.toUpperCase()}`,
  price: 100,
  image: `/garments/${id}.webp`,
  prompt: `Substitute the current top with garment ${id}, fitted naturally across the shoulders and chest with realistic folds`,
}));

export const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
export const settle = async (n = 4) => {
  for (let i = 0; i < n; i++) await tick();
};

// ── clock + timers ──────────────────────────────────────────────────────────
export class FakeClock implements Timers {
  t = 0;
  private next = 1;
  private pending = new Map<number, { at: number; fn: () => void }>();
  now = () => this.t;
  set(fn: () => void, ms: number) {
    const id = this.next++;
    this.pending.set(id, { at: this.t + ms, fn });
    return id;
  }
  clear(handle: unknown) {
    this.pending.delete(handle as number);
  }
  advance(ms: number) {
    const target = this.t + ms;
    for (;;) {
      let nextId = -1;
      let nextAt = Infinity;
      for (const [id, p] of this.pending) {
        if (p.at <= target && p.at < nextAt) {
          nextAt = p.at;
          nextId = id;
        }
      }
      if (nextId < 0) break;
      const p = this.pending.get(nextId)!;
      this.pending.delete(nextId);
      this.t = Math.max(this.t, p.at);
      p.fn();
    }
    this.t = target;
  }
  get timerCount() {
    return this.pending.size;
  }
}

// ── fake camera ─────────────────────────────────────────────────────────────
export class FakeTrack {
  kind = "video";
  readyState: "live" | "ended" = "live";
  stopCalls = 0;
  private listeners: Array<() => void> = [];
  stop() {
    this.stopCalls++;
    this.readyState = "ended";
  }
  addEventListener(type: string, fn: () => void) {
    if (type === "ended") this.listeners.push(fn);
  }
  /** The device was unplugged / the OS revoked access. */
  endExternally() {
    this.readyState = "ended";
    for (const l of this.listeners) l();
  }
}

export class FakeStream {
  tracks = [new FakeTrack()];
  getTracks() {
    return this.tracks;
  }
  getVideoTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return [];
  }
  get allStopped() {
    return this.tracks.every((t) => t.readyState === "ended");
  }
}

export class FakeCamera implements CameraService {
  streams: FakeStream[] = [];
  acquireCalls = 0;
  /** Queue of outcomes; empty = succeed. */
  private outcomes: Array<PermissionReason | "ok"> = [];
  private deferred: { resolve: (s: MediaStream) => void; reject: (e: unknown) => void } | null = null;
  private holdNext = false;

  failNext(reason: PermissionReason) {
    this.outcomes.push(reason);
  }
  /** The next acquire() waits until grant()/deny() — simulates the browser prompt being open. */
  holdPrompt() {
    this.holdNext = true;
  }
  grant() {
    const s = new FakeStream();
    this.streams.push(s);
    this.deferred?.resolve(s as unknown as MediaStream);
    this.deferred = null;
    return s;
  }
  deny(reason: PermissionReason = "denied") {
    this.deferred?.reject(new CameraError(reason));
    this.deferred = null;
  }
  get last() {
    return this.streams[this.streams.length - 1];
  }
  get liveStreams() {
    return this.streams.filter((s) => !s.allStopped);
  }

  acquire(): Promise<MediaStream> {
    this.acquireCalls++;
    if (this.holdNext) {
      this.holdNext = false;
      return new Promise((resolve, reject) => {
        this.deferred = { resolve, reject };
      });
    }
    const outcome = this.outcomes.shift() ?? "ok";
    if (outcome !== "ok") return Promise.reject(new CameraError(outcome));
    const s = new FakeStream();
    this.streams.push(s);
    return Promise.resolve(s as unknown as MediaStream);
  }
}

// ── fake provider ───────────────────────────────────────────────────────────
export class FakeSession implements TryOnSession {
  setCalls: Garment[] = [];
  disconnects = 0;
  failSets = false;
  /** When set, setGarment() waits until release() is called. */
  hold = false;
  private waiters: Array<() => void> = [];
  async setGarment(g: Garment) {
    this.setCalls.push(g);
    if (this.hold) await new Promise<void>((resolve) => this.waiters.push(resolve));
    if (this.failSets) throw new Error("set failed");
  }
  release() {
    const w = this.waiters;
    this.waiters = [];
    for (const f of w) f();
  }
  async disconnect() {
    this.disconnects++;
  }
}

export class FakeProvider implements TryOnProvider {
  mode: "live" | "sim" = "live";
  connects: Array<{ stream: MediaStream; options: ConnectOptions }> = [];
  sessions: FakeSession[] = [];
  prepared = 0;
  failConnectWith: unknown = null;
  autoLive = false;
  prepare() {
    this.prepared++;
  }
  async connect(stream: MediaStream, options: ConnectOptions) {
    this.connects.push({ stream, options });
    if (this.failConnectWith) throw this.failConnectWith;
    const s = new FakeSession();
    this.sessions.push(s);
    if (this.autoLive) {
      options.onRemoteStream({} as MediaStream);
      options.onState("live");
    }
    return s;
  }
  get last() {
    return this.connects[this.connects.length - 1].options;
  }
  get session() {
    return this.sessions[this.sessions.length - 1];
  }
}

export function collectEvents() {
  const events: TryOnEvent[] = [];
  return { events, onEvent: (e: TryOnEvent) => events.push(e), names: () => events.map((e) => e.name) };
}
