"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import type { TryOnSnapshot } from "../controller.ts";
import { copy, formatMs, formatPrice } from "../copy.ts";
import type { Garment, TryOnMode } from "../types.ts";
import { Button } from "./Button";
import { CheckIcon, CloseIcon, CollapseIcon, ExpandIcon, Spinner } from "./icons";
import { RemoteVideo } from "./RemoteVideo";

export interface StageActions {
  tryOn: (garmentId: string) => void;
  close: () => void;
  toggleFullscreen: () => void;
  onFrame: () => void;
}

/** connecting / live / switching — the dark stage. The video is mounted from `connecting` so the first frame is seen the moment it exists. */
export function Stage({
  snap,
  garments,
  mode,
  actions,
}: {
  snap: TryOnSnapshot;
  garments: Garment[];
  mode: TryOnMode;
  actions: StageActions;
}) {
  const connecting = snap.state === "connecting";
  const switching = snap.state === "switching";
  const live = snap.state === "live" || switching;
  const target = garments.find((g) => g.id === snap.garmentId);
  const applied = garments.find((g) => g.id === snap.appliedId);
  const slow = snap.degraded || snap.quality === "poor" || snap.quality === "critical";
  const noticeGarment = snap.notice ? garments.find((g) => g.id === snap.notice?.garmentId) : undefined;

  return (
    <div data-stage data-testid="stage" className="anim-fade absolute inset-0 bg-stage text-on-stage">
      <RemoteVideo
        stream={snap.remoteStream}
        onFrame={actions.onFrame}
        label="Your live try-on"
        className={cn(
          "soft-swap absolute inset-0 h-full w-full object-cover lg:object-contain",
          !live && "opacity-0",
          switching && "opacity-80 saturate-[0.85]",
        )}
      />

      {/* Scrims keep every overlay legible over any frame. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/75 to-transparent" />

      {connecting && (
        <div className="anim-fade absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <Spinner size={38} />
          <p data-autofocus tabIndex={-1} className="font-serif text-[26px] leading-tight sm:text-[30px]">
            {copy.connecting.text}
          </p>
          <Button variant="stage" onClick={actions.close}>
            {copy.connecting.cancel}
          </Button>
        </div>
      )}

      {/* Control cluster: Close is always reachable and always hard-stops. */}
      <div className="pad-safe-top pad-safe-x absolute right-0 top-0 z-20 flex gap-2">
        {live && (
          <Button
            variant="icon"
            onClick={actions.toggleFullscreen}
            aria-label={snap.fullscreen ? copy.fullscreenExit : copy.fullscreenEnter}
            aria-pressed={snap.fullscreen}
            title={snap.fullscreen ? copy.fullscreenExit : copy.fullscreenEnter}
          >
            {snap.fullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </Button>
        )}
        <Button variant="icon" onClick={actions.close} aria-label={copy.closeLabel} title={copy.closeLabel} data-testid="close">
          <CloseIcon />
        </Button>
      </div>

      {live && (
        <div className="pad-safe-bottom pad-safe-x anim-fade absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 pt-6">
          {/* Transient status, one line at most. */}
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            {switching && target && (
              <span className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-sm backdrop-blur">
                <Spinner size={14} />
                {copy.switching(target.name)}
              </span>
            )}
            {slow && !switching && (
              <span className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-sm backdrop-blur">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sim" />
                {copy.degraded}
              </span>
            )}
            {snap.notice && noticeGarment && !switching && (
              <span className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-sm backdrop-blur">
                {copy.switchFailed(noticeGarment.name, applied?.name ?? "the previous piece")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 text-sm">
              {applied && (
                <p className="truncate font-medium" data-testid="applied-name">
                  {applied.name}
                  <span className="font-normal text-on-stage-2"> · {formatPrice(applied.price)}</span>
                </p>
              )}
              <p className="mt-0.5 text-[13px] text-on-stage-2" data-testid="readout">
                {mode === "sim" ? (
                  copy.readout.sim
                ) : (
                  <>
                    <span title={copy.readout.measuredNote}>
                      {copy.readout.firstFrame} {formatMs(snap.ttffMs)} · {copy.readout.lastSwitch} {formatMs(snap.switchMs)}
                    </span>
                    {snap.quality && (
                      <span>
                        {" "}
                        · {copy.readout.connection} {snap.quality}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <ul className="flex shrink-0 gap-2" aria-label={copy.garmentSwitcher}>
              {garments.map((g) => {
                const active = g.id === snap.garmentId;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => actions.tryOn(g.id)}
                      aria-label={copy.tryOnLabel(g.name)}
                      aria-pressed={active}
                      title={g.name}
                      data-testid={`tray-${g.id}`}
                      className={cn(
                        "relative block h-[60px] w-12 overflow-hidden rounded-xl bg-tint ring-offset-0 transition-[box-shadow,transform] duration-150 active:scale-95",
                        active ? "ring-2 ring-on-stage" : "opacity-85 ring-1 ring-white/25 hover:opacity-100",
                      )}
                    >
                      <Image src={g.image} alt="" fill sizes="48px" className="object-cover object-[50%_58%]" />
                      {active && (
                        <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-on-stage text-ink">
                          <CheckIcon width={11} height={11} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
