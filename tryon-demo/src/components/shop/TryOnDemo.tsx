"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DecartProvider, LocalPoseProvider, TryOn, type TryOnEvent, type TryOnHandle, type TryOnPanelState } from "@/components/tryon";
import { garments } from "@/data/garments";
import type { TryOnConfig } from "@/lib/config";
import { GarmentCard, type CardPhase } from "./GarmentCard";

// Drag-and-drop needs a mouse. Phones and tablets get tap-to-select only.
const finePointer = {
  subscribe: (cb: () => void) => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  },
  get: () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
};

/** Light instrumentation: only events that answer a question. Logged to the console; wire onEvent to any sink. */
const logEvent = (e: TryOnEvent) => console.debug("[tryon]", JSON.stringify(e));

/**
 * The demo's one stateful surface: garment cards beside the <TryOn> panel.
 * The mode (live | simulation) is decided on the server; this only swaps the provider — same component either way.
 */
export function TryOnDemo({ config }: { config: TryOnConfig }) {
  const tryOn = useRef<TryOnHandle>(null);
  const [panel, setPanel] = useState<TryOnPanelState>({ state: "idle", garmentId: null, appliedId: null });
  const [dragging, setDragging] = useState<string | null>(null);
  const canDrag = useSyncExternalStore(finePointer.subscribe, finePointer.get, () => false);

  const provider = useMemo(
    () => (config.mode === "live" ? new DecartProvider({ model: config.model, fast: config.fast }) : new LocalPoseProvider()),
    [config.mode, config.model, config.fast],
  );

  // "On you" only for what is actually rendered on the shopper; what they just chose but has not landed yet is "Selected".
  const phaseOf = (id: string): CardPhase => {
    if (panel.state === "idle") return "idle";
    const rendering = panel.state === "live" || panel.state === "switching";
    if (rendering && panel.appliedId === id) return "live";
    return panel.garmentId === id ? "selected" : "idle";
  };

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <section aria-labelledby="pieces-heading" className="min-w-0">
        {/* Keeps the heading outline honest: h1 > h2 (pieces) > h3 (each product). */}
        <h2 id="pieces-heading" className="sr-only">
          Pieces to try on
        </h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
          {garments.map((g, i) => (
            <li key={g.id} className="min-w-0">
              <GarmentCard
                garment={g}
                phase={phaseOf(g.id)}
                // While the browser's own permission prompt is open there is nothing useful to pick.
                disabled={panel.state === "requesting-permission"}
                dragging={dragging === g.id}
                canDrag={canDrag}
                priority={i < 2}
                onTryOn={(el) => tryOn.current?.tryOn(g.id, el)}
                onDragChange={(d) => setDragging(d ? g.id : null)}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="min-w-0 lg:sticky lg:top-6">
        <TryOn
          ref={tryOn}
          garments={garments}
          provider={provider}
          maxSessionSeconds={config.mode === "live" ? config.maxSessionSeconds : 0}
          onEvent={logEvent}
          onStateChange={setPanel}
        />
      </div>
    </div>
  );
}
