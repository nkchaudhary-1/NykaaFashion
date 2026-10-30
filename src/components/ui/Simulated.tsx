import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

/** Marks anything simulated, per the PRD: "label it so it isn't mistaken for production personalisation". */
export function SimulatedTag({ children = "Simulated", note, className, onDark }: { children?: string; note?: string; className?: string; onDark?: boolean }) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <span tabIndex={0} aria-label={`${children}${note ? `: ${note}` : ""}`} className={cn("inline-flex h-[22px] cursor-help items-center gap-1 border px-2 text-[10px] font-medium uppercase leading-none tracking-[0.12em]", onDark ? "border-bone/40 text-bone/80" : "border-amber/40 bg-amber-tint text-amber")}>
        <FlaskConical size={11} aria-hidden />
        {children}
      </span>
      {note && (
        <span role="tooltip" className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-60 border border-line bg-paper p-3 text-[12px] font-normal normal-case leading-snug tracking-normal text-ink-2 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          {note}
        </span>
      )}
    </span>
  );
}

export function SimulatedNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="note" className={cn("flex items-start gap-3 border border-amber/30 bg-amber-tint px-4 py-3 text-[13px] leading-snug text-amber", className)}>
      <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
