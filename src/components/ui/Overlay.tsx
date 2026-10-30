"use client";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useFocusTrap, useScrollLock } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/store";

export type OverlaySide = "center" | "right" | "left" | "bottom" | "top";

interface Props {
  open: boolean;
  onClose: () => void;
  /** accessible name for the dialog */
  label: string;
  side?: OverlaySide;
  /** on phones, "center" dialogs become bottom sheets */
  mobileSheet?: boolean;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
  hideClose?: boolean;
  z?: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function Overlay(props: Props) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(<AnimatePresence>{props.open && <Inner key="overlay" {...props} />}</AnimatePresence>, document.body);
}

function Inner({ onClose, label, side = "center", mobileSheet = true, className, panelClassName, children, hideClose, z = 70 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const effective: OverlaySide = side === "center" && mobileSheet && mobile ? "bottom" : side;
  useScrollLock(true);
  useFocusTrap(ref, true, onClose);

  const hidden = reduce
    ? { opacity: 0 }
    : effective === "right"
      ? { x: "100%" }
      : effective === "left"
        ? { x: "-100%" }
        : effective === "bottom"
          ? { y: "100%" }
          : effective === "top"
            ? { y: "-12%", opacity: 0 }
            : { opacity: 0, scale: 0.97, y: 12 };
  const shown = reduce ? { opacity: 1 } : { x: 0, y: 0, scale: 1, opacity: 1 };

  const pos: Record<OverlaySide, string> = {
    center: "left-1/2 top-1/2 w-[min(92vw,560px)] max-h-[88dvh] -translate-x-1/2 -translate-y-1/2 border border-ink",
    right: "inset-y-0 right-0 w-[min(100vw,460px)] border-l border-ink",
    left: "inset-y-0 left-0 w-[min(100vw,420px)] border-r border-ink",
    bottom: "inset-x-0 bottom-0 max-h-[90dvh] border-t border-ink",
    top: "inset-x-0 top-0 max-h-[100dvh] border-b border-ink",
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <div className={cn("fixed inset-0", className)} style={{ zIndex: z }}>
      <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("fixed flex flex-col overflow-hidden bg-white outline-none", pos[effective], panelClassName)}
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={{ duration: reduce ? 0.01 : 0.42, ease: EASE }}
        drag={effective === "bottom" && !reduce ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={onDragEnd}
      >
        {effective === "bottom" && <div aria-hidden className="mx-auto mt-2.5 h-[3px] w-10 shrink-0 bg-line-strong" />}
        {children}
        {!hideClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 inline-flex size-11 items-center justify-center text-ink transition-colors hover:bg-sand">
            <X size={20} strokeWidth={1.6} />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export function OverlayHeader({ title, sub, className }: { title: string; sub?: string; className?: string }) {
  return (
    <div className={cn("shrink-0 border-b border-line px-5 pb-4 pt-4 pr-14 sm:px-6", className)}>
      <h2 className="display-xs">{title}</h2>
      {sub && <p className="mt-1 text-[13px] text-ink-3">{sub}</p>}
    </div>
  );
}
/** `flush` drops the gutters for edge-to-edge content (cn() is a plain join, so padding can't be overridden by a class). */
export const OverlayBody = ({ children, className, flush }: { children: ReactNode; className?: string; flush?: boolean }) => <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", !flush && "px-5 py-5 sm:px-6", className)}>{children}</div>;
export const OverlayFooter = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("shrink-0 border-t border-line bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6", className)}>{children}</div>;
