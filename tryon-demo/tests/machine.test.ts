import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialMachineState, reduce, type MachineEvent, type MachineState } from "../src/components/tryon/machine.ts";

const run = (events: MachineEvent[], from: MachineState = initialMachineState) => events.reduce(reduce, from);
const err = { kind: "dropped" as const, message: "x" };

const toConsent = () => run([{ type: "TRY_ON", garmentId: "a" }]);
const toRequesting = () => run([{ type: "AGREE" }], toConsent());
const toConnecting = () => run([{ type: "CAMERA_OK" }], toRequesting());
const toLive = () => run([{ type: "FIRST_FRAME", ms: 1500, garmentId: "a" }], toConnecting());
const toSwitching = () => run([{ type: "TRY_ON", garmentId: "b" }], toLive());

// The PRD's state-machine table, row by row.
describe("state machine — PRD transition table", () => {
  it("idle --Try on/drop--> consent", () => {
    const s = toConsent();
    assert.equal(s.state, "consent");
    assert.equal(s.garmentId, "a");
  });
  it("consent --Agree--> requesting-permission", () => assert.equal(toRequesting().state, "requesting-permission"));
  it("consent --Not now--> idle (and forgets the choice)", () => {
    const s = run([{ type: "DECLINE" }], toConsent());
    assert.equal(s.state, "idle");
    assert.equal(s.garmentId, null);
  });
  it("requesting-permission --camera allowed--> connecting", () => assert.equal(toConnecting().state, "connecting"));
  it("requesting-permission --camera denied--> permission-denied (with the reason)", () => {
    const s = run([{ type: "CAMERA_DENIED", reason: "dismissed" }], toRequesting());
    assert.equal(s.state, "permission-denied");
    assert.equal(s.permissionReason, "dismissed");
  });
  it("permission-denied --Retry--> requesting-permission", () => {
    const denied = run([{ type: "CAMERA_DENIED", reason: "denied" }], toRequesting());
    assert.equal(reduce(denied, { type: "RETRY" }).state, "requesting-permission");
  });
  it("connecting --first frame--> live, recording time-to-first-frame", () => {
    const s = toLive();
    assert.equal(s.state, "live");
    assert.equal(s.ttffMs, 1500);
    assert.equal(s.appliedId, "a");
  });
  it("connecting --fail/timeout--> error", () => {
    const s = run([{ type: "FAIL", error: { kind: "timeout", message: "t" } }], toConnecting());
    assert.equal(s.state, "error");
    assert.equal(s.error?.kind, "timeout");
  });
  it("live --switch garment--> switching", () => {
    const s = toSwitching();
    assert.equal(s.state, "switching");
    assert.equal(s.garmentId, "b");
    assert.equal(s.appliedId, "a", "the old garment stays applied until the swap lands");
  });
  it("switching --updated frame--> live, recording time-to-switch", () => {
    const s = run([{ type: "SWITCH_DONE", garmentId: "b", ms: 820 }], toSwitching());
    assert.equal(s.state, "live");
    assert.equal(s.appliedId, "b");
    assert.equal(s.switchMs, 820);
  });
  it("live / switching --stream drops--> error", () => {
    assert.equal(run([{ type: "FAIL", error: err }], toLive()).state, "error");
    assert.equal(run([{ type: "FAIL", error: err }], toSwitching()).state, "error");
  });
  it("error --Retry--> connecting (no reload, fresh timings)", () => {
    const errored = run([{ type: "FAIL", error: err }], toLive());
    const s = reduce(errored, { type: "RETRY" });
    assert.equal(s.state, "connecting");
    assert.equal(s.error, null);
    assert.equal(s.ttffMs, null);
    assert.equal(s.garmentId, "a", "keeps the garment the shopper was on");
  });
  it("any active state --Close/unmount--> idle", () => {
    for (const from of [toConsent(), toRequesting(), toConnecting(), toLive(), toSwitching()]) {
      assert.equal(reduce(from, { type: "CLOSE" }).state, "idle");
    }
    const errored = run([{ type: "FAIL", error: err }], toLive());
    assert.equal(reduce(errored, { type: "CLOSE" }).state, "idle");
  });
});

describe("state machine — edge cases from the PRD", () => {
  it("second Try on of the SAME garment while live changes nothing", () => {
    const live = toLive();
    assert.equal(reduce(live, { type: "TRY_ON", garmentId: "a" }), live);
  });
  it("second Try on of a DIFFERENT garment while live is a switch, not a new session", () => {
    const s = reduce(toLive(), { type: "TRY_ON", garmentId: "b" });
    assert.equal(s.state, "switching");
  });
  it("rapid switching: the last selection wins", () => {
    const s = run(
      [
        { type: "TRY_ON", garmentId: "b" },
        { type: "TRY_ON", garmentId: "c" },
        { type: "TRY_ON", garmentId: "d" },
      ],
      toLive(),
    );
    assert.equal(s.state, "switching");
    assert.equal(s.garmentId, "d");
    assert.equal(s.appliedId, "a");
  });
  it("a swap that finishes while a newer choice is pending keeps the panel in switching", () => {
    const s = run(
      [
        { type: "TRY_ON", garmentId: "b" },
        { type: "TRY_ON", garmentId: "c" },
        { type: "SWITCH_DONE", garmentId: "b", ms: 700 },
      ],
      toLive(),
    );
    assert.equal(s.state, "switching");
    assert.equal(s.appliedId, "b");
    assert.equal(s.garmentId, "c");
  });
  it("choosing the garment already applied while switching settles back to the right target", () => {
    const s = run([{ type: "TRY_ON", garmentId: "b" }, { type: "TRY_ON", garmentId: "a" }], toLive());
    assert.equal(s.garmentId, "a");
  });
  it("a newer choice made while connecting goes straight into a switch on the first frame", () => {
    const connecting = reduce(toConnecting(), { type: "TRY_ON", garmentId: "b" });
    assert.equal(connecting.state, "connecting");
    const s = reduce(connecting, { type: "FIRST_FRAME", ms: 900, garmentId: "a" });
    assert.equal(s.state, "switching");
    assert.equal(s.appliedId, "a");
    assert.equal(s.garmentId, "b");
  });
  it("a failed swap does not kill the session: back to live on the garment still on screen, with a notice", () => {
    const s = run([{ type: "SWITCH_FAILED", garmentId: "b", appliedId: "a" }], toSwitching());
    assert.equal(s.state, "live");
    assert.equal(s.garmentId, "a");
    assert.deepEqual(s.notice, { kind: "switch-failed", garmentId: "b" });
  });
  it("retry after a drop that finds the camera blocked lands in permission-denied", () => {
    const retrying = reduce(run([{ type: "FAIL", error: err }], toLive()), { type: "RETRY" });
    assert.equal(reduce(retrying, { type: "CAMERA_DENIED", reason: "denied" }).state, "permission-denied");
  });
  it("fullscreen only opens on a live/switching panel, and any exit from the session clears it", () => {
    assert.equal(reduce(toConsent(), { type: "FULLSCREEN", on: true }).fullscreen, false);
    assert.equal(reduce(toConnecting(), { type: "FULLSCREEN", on: true }).fullscreen, false);
    const fs = reduce(toLive(), { type: "FULLSCREEN", on: true });
    assert.equal(fs.fullscreen, true);
    assert.equal(reduce(fs, { type: "CLOSE" }).fullscreen, false);
    assert.equal(reduce(fs, { type: "FAIL", error: err }).fullscreen, false);
  });
  it("late events from a torn-down session are ignored", () => {
    const idle = initialMachineState;
    assert.equal(reduce(idle, { type: "FAIL", error: err }), idle);
    assert.equal(reduce(idle, { type: "FIRST_FRAME", ms: 1, garmentId: "a" }), idle);
    assert.equal(reduce(idle, { type: "CAMERA_OK" }), idle);
    assert.equal(reduce(idle, { type: "SWITCH_DONE", garmentId: "a", ms: 1 }), idle);
    assert.equal(reduce(toConsent(), { type: "FAIL", error: err }).state, "consent");
  });
  it("closing wipes everything: no stale garment, timings, notice, or fullscreen", () => {
    const s = reduce(reduce(toSwitching(), { type: "FULLSCREEN", on: true }), { type: "CLOSE" });
    assert.deepEqual(s, initialMachineState);
  });
});
