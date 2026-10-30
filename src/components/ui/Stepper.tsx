import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** A square numbered marker: done = solid pink with a tick, current = pink outline, upcoming = hairline. No circles. */
export function StepMark({ n, state, className }: { n: number; state: "done" | "current" | "todo"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center border text-[12px] font-medium tabular-nums transition-colors duration-300",
        state === "done" ? "border-pink bg-pink text-white" : state === "current" ? "border-pink bg-white text-pink-ink" : "border-line-strong text-ink-3",
        className,
      )}
    >
      {state === "done" ? <Check size={14} strokeWidth={2.6} /> : n}
    </span>
  );
}

/**
 * Checkout progress rail. The steps are equal columns separated by the page gap, so three steps land exactly on the
 * 4 / 4 / 4 columns of the 12-column grid. A 2px bar tops each step (pink once reached), then a square marker and the label.
 */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol aria-label="Checkout progress" className={cn("grid gap-x-[var(--gap)]", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} aria-current={active ? "step" : undefined} className="min-w-0">
            <span aria-hidden className={cn("block h-0.5 transition-colors duration-500", done || active ? "bg-pink" : "bg-line-strong")} />
            <span className="mt-3 flex min-w-0 items-center gap-2.5">
              <StepMark n={i + 1} state={done ? "done" : active ? "current" : "todo"} />
              <span className={cn("truncate text-[11px] font-semibold uppercase tracking-[0.09em] sm:text-[12px]", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>
                {s}
                {(done || active) && <span className="sr-only">{done ? " (completed)" : " (current step)"}</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
