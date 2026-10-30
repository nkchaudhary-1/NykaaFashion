import { RefreshCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/** Empty states guide toward discovery (PRD §7.6) — never a dead end. */
export function EmptyState({ title, text, actions, visual, className }: { title: string; text?: string; actions?: ReactNode; visual?: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center sm:py-20", className)}>
      {visual && <div className="mb-8 w-full max-w-[220px]">{visual}</div>}
      <h2 className="display-sm">{title}</h2>
      {text && <p className="mt-3 max-w-md text-[15px] text-ink-2">{text}</p>}
      {actions && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}

/** Inline error with retry — never a blank screen (PRD §7.5). */
export function ErrorState({ title = "We couldn’t load this", text = "Something went wrong on our side. Check your connection and try again.", onRetry, className, compact }: { title?: string; text?: string; onRetry?: () => void; className?: string; compact?: boolean }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center border border-dashed border-line-strong bg-paper px-6 text-center", compact ? "py-8" : "py-14", className)}>
      <WifiOff aria-hidden size={26} strokeWidth={1.4} className="text-ink-3" />
      <h2 className="mt-4 text-[17px] font-medium text-ink">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[14px] text-ink-3">{text}</p>
      {onRetry && (
        <Button variant="secondary" size="md" className="mt-6" icon={<RefreshCw size={15} />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
