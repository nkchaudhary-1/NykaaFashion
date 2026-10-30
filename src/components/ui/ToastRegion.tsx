"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { dismissToast, toastStore } from "@/stores/ui";

export function ToastRegion() {
  const toasts = useStore(toastStore);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+var(--sticky-h,0px)+env(safe-area-inset-bottom)+12px)] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <div role="status" aria-live="polite" aria-atomic="false" className="flex w-full max-w-[420px] flex-col items-stretch gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className={cn("pointer-events-auto flex items-start gap-3 bg-ink px-4 py-3.5 text-bone shadow-[0_18px_50px_-16px_rgba(22,18,15,0.6)]", t.tone === "error" && "bg-danger")}>
              {t.tone === "error" ? <CircleAlert size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#9fd8bd]" />}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[12.5px] leading-snug text-bone/75">{t.description}</p>}
              </div>
              {t.action &&
                (t.action.href ? (
                  <Link href={t.action.href} onClick={() => dismissToast(t.id)} className="shrink-0 self-center text-[12px] font-medium uppercase tracking-[0.1em] underline underline-offset-4">
                    {t.action.label}
                  </Link>
                ) : (
                  <button type="button" onClick={() => { t.action?.onClick?.(); dismissToast(t.id); }} className="shrink-0 self-center text-[12px] font-medium uppercase tracking-[0.1em] underline underline-offset-4">
                    {t.action.label}
                  </button>
                ))}
              <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)} className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center text-bone/70 hover:text-bone">
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
