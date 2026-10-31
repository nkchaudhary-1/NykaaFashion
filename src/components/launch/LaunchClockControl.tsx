"use client";
import { RotateCcw } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { SimulatedTag } from "@/components/ui/Simulated";
import { launchAtMs, type BrandLaunch } from "@/data/launches";
import { presetAt, rememberPreset, useLaunchClock } from "./clock";
import { afterLaunchWeekMs, leadLaunch, longDate, readout } from "./time";

/*
 * The Launch clock — a prototype control (labelled as one, like the site's other simulated parts) that moves the whole site's clock so every state of a launch can be
 * shown without waiting: real time · an hour before · at launch · a week after. The presets are relative to the brand it is given (a brand's own page) or, on the hub, to the
 * brand the hub leads with at the real time. The clock is a cookie, so the server's guard on a piece's product page agrees with what the page shows.
 */
const PRESETS = [
  { id: "real", label: "Real time" },
  { id: "before", label: "1 hour before launch" },
  { id: "launch", label: "At launch" },
  { id: "after", label: "1 week after launch" },
] as const;
type PresetId = (typeof PRESETS)[number]["id"];

const targetOf = (id: Exclude<PresetId, "real">, l: BrandLaunch) => (id === "before" ? launchAtMs(l) - 3_600_000 : id === "launch" ? launchAtMs(l) : afterLaunchWeekMs(l));

export function LaunchClockControl({ launch }: { launch?: BrandLaunch }) {
  const { now, offset, ready, setTo, reset } = useLaunchClock();
  const target = launch ?? leadLaunch(now - offset);
  const active = offset === 0 ? "real" : presetAt(offset);

  const choose = (id: PresetId) => {
    if (id === "real") {
      rememberPreset(id, 0);
      reset();
      return;
    }
    if (!target) return;
    rememberPreset(id, setTo(targetOf(id, target)));
  };

  return (
    <div className="border-y border-line bg-paper">
      <div className="container-x grid-main items-center gap-y-3 py-4">
        <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-5">
          <SimulatedTag note="Moves this browser’s clock — and the server’s view of it — so every launch state can be shown without waiting. Nothing is sent anywhere.">Prototype · Launch clock</SimulatedTag>
          <p className="mt-2.5 text-[13px] tabular-nums text-ink-2">
            <span className="sr-only">The page’s time: </span>
            {ready ? readout(now) : "Reading the clock…"}
            <span className="ml-2 text-ink-3">{offset === 0 ? "· real time" : "· simulated"}</span>
          </p>
          {target && (
            <p className="mt-1 text-[12px] text-ink-3">
              Jumps to the {target.brand.name} launch · {longDate(launchAtMs(target))}
            </p>
          )}
        </div>
        <div className="col-span-4 flex min-w-0 flex-wrap items-center gap-2 sm:col-span-12 lg:col-span-7 lg:justify-end">
          <div role="group" aria-label="Prototype · Launch clock" className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <Chip key={p.id} selected={active === p.id} onClick={() => choose(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          {offset !== 0 && (
            <button type="button" onClick={() => choose("real")} className="tap inline-flex h-10 items-center gap-2 px-2 text-[12px] font-semibold uppercase tracking-[0.09em] underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70">
              <RotateCcw size={13} aria-hidden /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
