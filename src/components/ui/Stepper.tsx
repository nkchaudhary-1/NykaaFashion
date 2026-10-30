import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em]", className)} aria-label="Checkout progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} aria-current={active ? "step" : undefined} className="flex items-center gap-2">
            <span className={cn("inline-flex size-6 items-center justify-center rounded-full border text-[11px] transition-colors duration-300", done ? "border-ink bg-ink text-bone" : active ? "border-ink text-ink" : "border-line-strong text-ink-3")}>
              {done ? <Check size={13} strokeWidth={2.6} /> : i + 1}
            </span>
            <span className={cn(active ? "text-ink" : done ? "text-ink-2" : "text-ink-3", !active && "hidden sm:inline")}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden className={cn("mx-1 h-px w-5 sm:w-10", done ? "bg-ink" : "bg-line-strong")} />}
          </li>
        );
      })}
    </ol>
  );
}
