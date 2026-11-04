"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import type { TryOnSnapshot } from "../controller.ts";
import { copy, formatMs, formatPrice } from "../copy.ts";
import type { Garment, TryOnMode } from "../types.ts";
import type { PhotoFlow } from "../TryOn";
import { Button } from "./Button";
import { CameraIcon, CheckIcon, CloseIcon, CollapseIcon, ExpandIcon, Spinner } from "./icons";
import { RemoteVideo } from "./RemoteVideo";

export interface StageActions {
  tryOn: (garmentId: string) => void;
  close: () => void;
  toggleFullscreen: () => void;
  onFrame: () => void;
}

export interface StagePhoto {
  host: string;
  flow: PhotoFlow;
  elapsed: number;
  start: () => void;
  dismiss: () => void;
}

/** connecting / live / switching — the dark stage. The video is mounted from `connecting` so the first frame is seen the moment it exists. */
export function Stage({
  snap,
  garments,
  mode,
  actions,
  photo,
}: {
  snap: TryOnSnapshot;
  garments: Garment[];
  mode: TryOnMode;
  actions: StageActions;
  photo?: StagePhoto;
}) {
  const connecting = snap.state === "connecting";
  const switching = snap.state === "switching";
  const live = snap.state === "live" || switching;
  const target = garments.find((g) => g.id === snap.garmentId);
  const applied = garments.find((g) => g.id === snap.appliedId);
  const slow = snap.degraded || snap.quality === "poor" || snap.quality === "critical";
  const noticeGarment = snap.notice ? garments.find((g) => g.id === snap.notice?.garmentId) : undefined;
  const flow = photo?.flow ?? { status: "idle" as const };
  const stillGarment = flow.status === "done" ? garments.find((g) => g.id === flow.garmentId) : undefined;

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

      {/* The rendered still, over the live view. Mirrored like the live view so it reads as the same mirror. */}
      {photo && flow.status === "done" && (
        <div data-testid="photo-still" className="anim-fade absolute inset-0 z-[15] bg-stage">
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from the shopper's own render, never optimised or stored */}
          <img src={flow.url} alt={copy.photo.alt(stillGarment?.name ?? "the garment")} className="absolute inset-0 h-full w-full -scale-x-100 object-contain" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
          <p className="pad-safe-x absolute left-0 top-[4.5rem] max-w-[70%] rounded-full bg-black/60 px-3.5 py-2 text-[13px] text-on-stage backdrop-blur" data-testid="photo-label">
            {copy.photo.label(flow.model, flow.ms)}
          </p>
          <div className="pad-safe-bottom pad-safe-x absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2">
            <Button variant="stage" onClick={photo.dismiss} data-testid="photo-back" data-autofocus>
              {copy.photo.back}
            </Button>
            <Button variant="icon" className="w-auto gap-2 px-4" onClick={photo.start} aria-label={copy.photo.again} title={copy.photo.again}>
              <CameraIcon width={16} height={16} />
              <span className="text-sm">{copy.photo.again}</span>
            </Button>
          </div>
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
            {photo && flow.status === "idle" && !switching && (
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button variant="stage" onClick={photo.start} data-testid="photo-button" aria-describedby="photo-hint" className="min-h-10 px-4 text-sm">
                  <CameraIcon width={16} height={16} />
                  {copy.photo.button}
                </Button>
                <span id="photo-hint" className="text-[12px] text-on-stage-2">
                  {copy.photo.hint(photo.host)}
                </span>
              </span>
            )}
            {photo && flow.status === "rendering" && (
              <span data-testid="photo-rendering" className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 py-1.5 pl-3.5 pr-1.5 text-sm backdrop-blur">
                <Spinner size={14} />
                {copy.photo.rendering(photo.host, photo.elapsed)}
                <Button variant="icon" className="h-8 w-8" onClick={photo.dismiss} aria-label={copy.photo.cancel} title={copy.photo.cancel}>
                  <CloseIcon width={14} height={14} />
                </Button>
              </span>
            )}
            {photo && flow.status === "error" && (
              <span data-testid="photo-error" role="alert" className="anim-fade inline-flex flex-wrap items-center gap-2 rounded-full bg-black/60 py-1.5 pl-3.5 pr-1.5 text-sm backdrop-blur">
                {flow.message}
                <Button variant="stage" className="min-h-8 px-3 text-[13px]" onClick={photo.start}>
                  {copy.photo.retry}
                </Button>
                <Button variant="icon" className="h-8 w-8" onClick={photo.dismiss} aria-label={copy.close} title={copy.close}>
                  <CloseIcon width={14} height={14} />
                </Button>
              </span>
            )}
            {switching && target && (
              <span className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-sm backdrop-blur">
                <Spinner size={14} />
                {copy.switching(target.name)}
              </span>
            )}
            {snap.hint && !switching && (
              <span data-testid="hint" className="anim-fade inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-sm backdrop-blur">
                {copy.hints[snap.hint]}
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
