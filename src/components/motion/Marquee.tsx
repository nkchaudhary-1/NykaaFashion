import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An endless ticker. Pure CSS (see `.marquee` in globals.css): pauses on hover, stands still for reduced motion. The second copy is hidden from assistive tech. */
export function Marquee({ children, seconds = 42, className, gap = "3.5rem" }: { children: ReactNode; seconds?: number; className?: string; gap?: string }) {
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" style={{ gap, paddingRight: gap }} aria-hidden={hidden || undefined}>
      {children}
    </div>
  );
  return (
    <div className={cn("marquee overflow-hidden", className)}>
      <div className="marquee-track" style={{ "--marquee-d": `${seconds}s` } as React.CSSProperties}>
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
