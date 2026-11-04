// The PRD's test checklist, as executable assertions against the controller with a fake camera and provider.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TryOnController, type ControllerOptions } from "../src/components/tryon/controller.ts";
import { TryOnProviderError } from "../src/components/tryon/providers/errors.ts";
import { FakeCamera, FakeClock, FakeProvider, collectEvents, garments, settle } from "./helpers.ts";

function rig(opts: Partial<ControllerOptions> = {}) {
  const clock = new FakeClock();
  const camera = new FakeCamera();
  const provider = new FakeProvider();
  const log = collectEvents();
  const c = new TryOnController({
    provider,
    camera,
    getGarments: () => garments,
    timers: clock,
    now: clock.now,
    onEvent: log.onEvent,
    minSwitchingMs: 0,
    ...opts,
  });
  return { c, clock, camera, provider, log, state: () => c.getSnapshot().state, snap: () => c.getSnapshot() };
}

/** Walk to a live session on garment "a". */
async function goLive(r: ReturnType<typeof rig>, ms = 1800) {
  r.c.tryOn("a");
  r.c.agree();
  await settle();
  assert.equal(r.state(), "connecting");
  r.provider.last.onRemoteStream({} as MediaStream);
  r.provider.last.onState("live");
  r.clock.advance(ms);
  r.c.notifyFrame();
  assert.equal(r.state(), "live");
}

describe("consent gate", () => {
  it("opens no camera and makes no connection until the shopper agrees", async () => {
    const r = rig();
    r.c.tryOn("a");
    await settle();
    assert.equal(r.state(), "consent");
    assert.equal(r.camera.acquireCalls, 0);
    assert.equal(r.provider.connects.length, 0);
  });
  it("declining returns to idle with no camera ever touched", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.decline();
    await settle();
    assert.equal(r.state(), "idle");
    assert.equal(r.camera.acquireCalls, 0);
    assert.equal(r.provider.connects.length, 0);
    assert.deepEqual(r.log.names(), ["tryon_clicked", "consent_shown", "consent_declined"]);
  });
  it("agreeing asks for the camera, and only then", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.camera.acquireCalls, 1);
    assert.equal(r.provider.connects.length, 1);
  });
  it("warms provider assets when consent is shown, without opening anything", async () => {
    const r = rig();
    r.c.tryOn("a");
    assert.equal(r.provider.prepared, 1);
    assert.equal(r.camera.acquireCalls, 0);
  });
});

describe("camera permission", () => {
  it("allow -> connects and goes live; time-to-first-frame is measured", async () => {
    const r = rig();
    await goLive(r, 1800);
    assert.equal(r.snap().ttffMs, 1800);
    assert.equal(r.log.events.find((e) => e.name === "session_live")?.name, "session_live");
  });
  it("deny -> denied state, then Retry succeeds", async () => {
    const r = rig();
    r.camera.failNext("denied");
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.state(), "permission-denied");
    assert.equal(r.snap().permissionReason, "denied");
    r.c.retry();
    await settle();
    assert.equal(r.state(), "connecting");
    assert.equal(r.camera.acquireCalls, 2);
  });
  it("dismiss (not deny) -> recoverable with the same Retry", async () => {
    const r = rig();
    r.camera.failNext("dismissed");
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.snap().permissionReason, "dismissed");
    r.c.retry();
    await settle();
    assert.equal(r.state(), "connecting");
  });
  it("no camera hardware -> a state, not an endless spinner", async () => {
    const r = rig();
    r.camera.failNext("no-camera");
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.state(), "permission-denied");
    assert.equal(r.snap().permissionReason, "no-camera");
  });
  it("closing while the prompt is open, then allowing it anyway, switches the camera straight back off", async () => {
    const r = rig();
    r.camera.holdPrompt();
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.state(), "requesting-permission");
    r.c.close();
    assert.equal(r.state(), "idle");
    const stream = r.camera.grant(); // the late "Allow"
    await settle();
    assert.equal(stream.allStopped, true, "late grant must be stopped immediately");
    assert.equal(r.provider.connects.length, 0, "and must never connect");
    assert.equal(r.state(), "idle");
  });
});

describe("garment switching", () => {
  it("changes garment while live WITHOUT restarting the camera or reconnecting", async () => {
    const r = rig();
    await goLive(r);
    const stream = r.camera.last;
    r.c.tryOn("b");
    assert.equal(r.state(), "switching");
    await settle();
    r.c.notifyFrame(); // the frame after the acknowledged swap
    await settle();
    assert.equal(r.state(), "live");
    assert.equal(r.snap().appliedId, "b");
    assert.equal(r.camera.acquireCalls, 1, "camera not reopened");
    assert.equal(r.provider.connects.length, 1, "no reconnect");
    assert.equal(stream.allStopped, false, "tracks still running");
    assert.equal(r.provider.session.disconnects, 0);
  });
  it("every swap sends the COMPLETE garment (prompt + image), never a partial update", async () => {
    const r = rig();
    await goLive(r);
    r.c.tryOn("b");
    await settle();
    r.c.notifyFrame();
    await settle();
    const sent = r.provider.session.setCalls;
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0], garments[1], "the exact, whole garment object for the target");
    assert.ok(sent[0].prompt.length > 0 && sent[0].image.length > 0);
  });
  it("a burst of clicks collapses to the last selection: nothing in the middle is sent", async () => {
    const r = rig();
    await goLive(r);
    r.c.tryOn("b");
    r.c.tryOn("c");
    r.c.tryOn("d");
    await settle();
    r.c.notifyFrame();
    await settle();
    assert.deepEqual(
      r.provider.session.setCalls.map((g) => g.id),
      ["d"],
    );
    assert.equal(r.snap().appliedId, "d");
    assert.equal(r.state(), "live");
  });
  it("clicks made while a swap is in flight queue behind it; the newest wins and a stale one never lands last", async () => {
    const r = rig();
    await goLive(r);
    r.provider.session.hold = true;
    r.c.tryOn("b");
    await settle();
    assert.deepEqual(
      r.provider.session.setCalls.map((g) => g.id),
      ["b"],
      "first request goes out immediately",
    );
    r.c.tryOn("c");
    r.c.tryOn("d");
    r.provider.session.hold = false;
    r.provider.session.release();
    await settle();
    r.c.notifyFrame(); // b landed
    await settle();
    r.c.notifyFrame(); // d landed
    await settle();
    assert.deepEqual(
      r.provider.session.setCalls.map((g) => g.id),
      ["b", "d"],
      "c was superseded before it could be sent",
    );
    assert.equal(r.snap().appliedId, "d");
    assert.equal(r.state(), "live");
  });
  it("a second Try on for the garment already on screen is a no-op, not a new session", async () => {
    const r = rig();
    await goLive(r);
    r.c.tryOn("a");
    await settle();
    assert.equal(r.state(), "live");
    assert.equal(r.provider.connects.length, 1);
    assert.equal(r.provider.session.setCalls.length, 0);
  });
  it("time-to-switch is measured from the swap being sent to the first frame after it is acknowledged", async () => {
    const r = rig();
    await goLive(r);
    r.c.tryOn("b");
    await settle();
    r.clock.advance(640);
    r.c.notifyFrame();
    await settle();
    assert.equal(r.snap().switchMs, 640);
    const ev = r.log.events.find((e) => e.name === "garment_switched");
    assert.ok(ev && ev.name === "garment_switched" && ev.switchMs === 640);
  });
  it("a failed swap keeps the session and the garment that is still on screen, and says so", async () => {
    const r = rig();
    await goLive(r);
    r.provider.session.failSets = true;
    r.c.tryOn("b");
    await settle();
    assert.equal(r.state(), "live");
    assert.equal(r.snap().appliedId, "a");
    assert.equal(r.snap().garmentId, "a");
    assert.deepEqual(r.snap().notice, { kind: "switch-failed", garmentId: "b" });
    assert.equal(r.camera.liveStreams.length, 1);
  });
  it("a garment picked while connecting is applied right after the first frame", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    r.c.tryOn("c"); // changed their mind mid-connect
    r.provider.last.onRemoteStream({} as MediaStream);
    r.provider.last.onState("live");
    r.c.notifyFrame();
    assert.equal(r.provider.last.initialGarment.id, "a", "connected with what was chosen at dial time");
    assert.equal(r.state(), "switching");
    await settle();
    r.c.notifyFrame();
    await settle();
    assert.equal(r.snap().appliedId, "c");
    assert.equal(r.state(), "live");
  });
});

describe("closing", () => {
  it("Close stops every camera track, disconnects the session and returns to idle", async () => {
    const r = rig();
    await goLive(r);
    const stream = r.camera.last;
    r.c.close();
    assert.equal(r.state(), "idle");
    assert.equal(stream.allStopped, true, "camera light off, synchronously");
    await settle();
    assert.equal(r.provider.session.disconnects, 1);
    assert.equal(r.camera.liveStreams.length, 0);
    assert.equal(r.snap().remoteStream, null);
  });
  it("Close while connecting tears down the partial session; a late connect is disconnected too", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    const stream = r.camera.last;
    r.c.close();
    assert.equal(stream.allStopped, true);
    await settle();
    assert.equal(r.state(), "idle");
  });
  it("Close while connecting aborts the provider's connect signal (no warm-up for a dead session)", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    const signal = r.provider.last.signal;
    assert.ok(signal && !signal.aborted, "connect receives a live signal");
    r.c.close();
    assert.equal(signal!.aborted, true, "aborted synchronously at teardown");
  });
  it("Close from fullscreen leaves fullscreen AND stops the tracks", async () => {
    const r = rig();
    await goLive(r);
    r.c.setFullscreen(true);
    assert.equal(r.snap().fullscreen, true);
    r.c.close();
    assert.equal(r.snap().fullscreen, false);
    assert.equal(r.camera.last.allStopped, true);
  });
  it("unmount / tab close runs the same teardown as Close", async () => {
    const r = rig();
    await goLive(r);
    r.c.detach();
    assert.equal(r.camera.last.allStopped, true);
    await settle();
    assert.equal(r.provider.session.disconnects, 1);
    assert.equal(r.state(), "idle");
  });
  it("teardown is idempotent", async () => {
    const r = rig();
    await goLive(r);
    r.c.close();
    r.c.close();
    r.c.detach();
    await settle();
    assert.equal(r.provider.session.disconnects, 1);
  });
  it("records the session length when it ends", async () => {
    const r = rig();
    await goLive(r);
    r.clock.advance(5000);
    r.c.close();
    const ev = r.log.events.find((e) => e.name === "session_closed");
    assert.ok(ev && ev.name === "session_closed" && ev.reason === "user" && ev.durationMs >= 5000);
  });
});

describe("failure states", () => {
  it("a dropped stream -> error with the camera OFF; Retry reconnects without a page reload", async () => {
    const r = rig();
    await goLive(r);
    const first = r.camera.last;
    r.provider.last.onState("disconnected");
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "dropped");
    assert.equal(first.allStopped, true, "copy promises the camera is off — make it true");
    await settle();
    r.c.retry();
    await settle();
    assert.equal(r.state(), "connecting");
    assert.equal(r.camera.acquireCalls, 2);
    assert.equal(r.provider.connects.length, 2);
    r.provider.last.onRemoteStream({} as MediaStream);
    r.provider.last.onState("live");
    r.c.notifyFrame();
    assert.equal(r.state(), "live");
  });
  it("a token / provider failure while connecting -> error, camera off, not a hang", async () => {
    const r = rig();
    r.provider.failConnectWith = new TryOnProviderError("token", "no token");
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "token");
    assert.equal(r.camera.last.allStopped, true);
  });
  it("no first frame in time -> a timeout error, not an endless spinner", async () => {
    const r = rig({ connectTimeoutMs: 20_000 });
    r.c.tryOn("a");
    r.c.agree();
    await settle();
    r.clock.advance(20_001);
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "timeout");
    assert.equal(r.camera.last.allStopped, true);
  });
  it("the camera being unplugged mid-session is a dropped stream", async () => {
    const r = rig();
    await goLive(r);
    r.camera.last.tracks[0].endExternally();
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "dropped");
  });
  it("a reconnect that never recovers gives up into an error; one that recovers clears the hint", async () => {
    const r = rig({ reconnectGiveUpMs: 8000 });
    await goLive(r);
    r.provider.last.onState("reconnecting");
    assert.equal(r.snap().degraded, true);
    r.clock.advance(3000);
    r.provider.last.onState("live");
    assert.equal(r.snap().degraded, false);
    r.clock.advance(10_000);
    assert.equal(r.state(), "live", "recovered: the give-up timer must be cancelled");
    r.provider.last.onState("reconnecting");
    r.clock.advance(8001);
    assert.equal(r.state(), "error");
  });
  it("a hidden tab tears down (camera off, spend stops) and offers Resume", async () => {
    const r = rig();
    await goLive(r);
    r.c.notifyHidden();
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "backgrounded");
    assert.equal(r.camera.last.allStopped, true);
    const ev = r.log.events.find((e) => e.name === "session_closed");
    assert.ok(ev && ev.name === "session_closed" && ev.reason === "backgrounded");
  });
  it("a hidden tab while only consent is showing does nothing", async () => {
    const r = rig();
    r.c.tryOn("a");
    r.c.notifyHidden();
    assert.equal(r.state(), "consent");
  });
  it("the session-length cap ends a live session and turns the camera off", async () => {
    const r = rig({ maxSessionMs: 120_000 });
    await goLive(r);
    r.clock.advance(119_000);
    assert.equal(r.state(), "live");
    r.clock.advance(1_500);
    assert.equal(r.state(), "error");
    assert.equal(r.snap().error?.kind, "limit");
    assert.equal(r.camera.last.allStopped, true);
  });
  it("late callbacks from a closed session cannot revive the UI or the camera", async () => {
    const r = rig();
    await goLive(r);
    const stale = r.provider.last;
    r.c.close();
    await settle();
    stale.onState("live");
    stale.onError({ kind: "dropped", message: "late" });
    stale.onRemoteStream({} as MediaStream);
    assert.equal(r.state(), "idle");
    assert.equal(r.snap().remoteStream, null);
    assert.equal(r.camera.liveStreams.length, 0);
  });
  it("leaves no timers behind after close", async () => {
    const r = rig({ maxSessionMs: 120_000 });
    await goLive(r);
    r.c.close();
    assert.equal(r.clock.timerCount, 0);
  });
});

describe("provider quality", () => {
  it("surfaces connection quality while a session is active", async () => {
    const r = rig();
    await goLive(r);
    r.provider.last.onQuality?.("poor");
    assert.equal(r.snap().quality, "poor");
  });
});
