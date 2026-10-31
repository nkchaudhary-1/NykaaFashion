"use client";
import { BellRing, Check } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { earlyAtMs, launchAtMs, launchById, type BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";
import { maskEmail, maskMobile } from "@/lib/format";
import { track } from "@/lib/track";
import { toast } from "@/stores/ui";
import { clearNotify, closeNotify, openNotify, parseContact, saveNotify, useNotified, useNotifyTarget } from "./notify";
import { dateTimeLine, shortDate, whenShort } from "./time";

/**
 * "Notify me" for a launch. Before a reminder exists it is a button that opens the dialog; once one is saved it reads "You’ll be notified ✓" with an Undo beside it —
 * on every button for that brand across the page, at once. (The state label is a button too, but a quiet one: pressing it does nothing; Undo is the control.)
 */
export function NotifyButton({ launch, variant = "primary", size = "lg", full, className, label = "Notify me" }: { launch: BrandLaunch; variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string; label?: string }) {
  const saved = useNotified(launch.id);
  if (!saved) {
    return (
      <Button variant={variant} size={size} full={full} className={className} icon={<BellRing size={16} aria-hidden />} onClick={() => openNotify(launch.id)} aria-haspopup="dialog" data-notify={launch.id}>
        {label}
      </Button>
    );
  }
  const undo = () => {
    clearNotify(launch.id);
    toast({ title: "Reminder removed", description: `We won’t message you about ${launch.brand.name}.` });
  };
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-5 gap-y-1", full && "w-full justify-between", className)}>
      <button type="button" aria-disabled="true" tabIndex={-1} data-notify={launch.id} className={cn("inline-flex cursor-default items-center gap-2 whitespace-nowrap border border-current px-5 text-[15px] font-semibold leading-none", size === "lg" ? "h-12 text-[16px]" : size === "md" ? "h-11" : "h-9 [@media(pointer:coarse)]:h-11")}>
        <Check size={16} aria-hidden /> You’ll be notified
      </button>
      <button type="button" onClick={undo} className="tap inline-flex min-h-9 items-center text-[12px] font-semibold uppercase tracking-[0.09em] underline decoration-1 underline-offset-4 transition-opacity duration-300 hover:opacity-70">
        Undo
        <span className="sr-only">: remove the {launch.brand.name} reminder</span>
      </button>
    </span>
  );
}

/** The dialog behind every Notify me button. Mount one per page. */
export function NotifyHost() {
  const id = useNotifyTarget();
  const launch = id ? launchById[id] : null;
  const was = useRef<string | null>(null);

  // A saved reminder turns the button the dialog was opened from into "You’ll be notified", so the dialog has nothing to hand focus back to (and focus would fall to the
  // page, out of a preview sheet underneath). Once the dialog has left, put focus on that label — unless focus already went somewhere (a dismissed dialog restores it itself).
  useEffect(() => {
    if (id) {
      was.current = id;
      return;
    }
    const prev = was.current;
    was.current = null;
    if (!prev) return;
    const t = window.setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-notify="${prev}"]`)).filter((el) => el.getClientRects().length > 0);
      (all.find((el) => el.closest('[role="dialog"]')) ?? all[0])?.focus({ preventScroll: true });
    }, 520);
    return () => window.clearTimeout(t);
  }, [id]);

  return (
    <Overlay open={!!launch} onClose={closeNotify} label={launch ? `Notify me about ${launch.brand.name}` : "Notify me"} side="center" panelClassName="sm:w-[min(94vw,520px)] sm:max-h-[90dvh]">
      {launch && <NotifyBody key={launch.id} launch={launch} />}
    </Overlay>
  );
}

function NotifyBody({ launch }: { launch: BrandLaunch }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const early = earlyAtMs(launch);
  const at = launchAtMs(launch);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = parseContact(value);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    saveNotify(launch.id, r.contact);
    track("notify_me", { launchId: launch.id });
    const shown = r.contact.includes("@") ? maskEmail(r.contact) : maskMobile(r.contact);
    toast({ title: "You’ll be notified", description: `${launch.brand.name} opens ${shortDate(at)} — we’ll message ${shown}. Simulated: saved on this device only.` });
    closeNotify();
  };

  return (
    <>
      {/* a div, not <header>: the dialog adds no second banner landmark */}
      <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Notify me</h2>
        <p className="mt-1 truncate text-[13.5px] text-ink-3">{`${launch.brand.name} · ${shortDate(at)}`}</p>
      </div>
      <OverlayBody>
        <form onSubmit={submit} noValidate className="space-y-5">
          <p className="text-[15px] leading-relaxed text-ink-2">
            We’ll message you the moment {launch.brand.name} opens — <span className="whitespace-nowrap text-ink">{dateTimeLine(at)}</span>.
            {early !== null && (
              <>
                {" "}
                Members get early access from <span className="whitespace-nowrap text-ink">{whenShort(early)}</span>; we’ll tell you then, too.
              </>
            )}
          </p>
          <Input label="Mobile number or email" autoComplete="email" value={value} onChange={(e) => (setValue(e.target.value), setError(null))} error={error} hint="One message when it opens. No marketing." data-autofocus />
          <SimulatedNotice>Simulated — saved on this device only. Nothing is sent.</SimulatedNotice>
          <Button type="submit" full size="lg" icon={<BellRing size={16} aria-hidden />}>
            Notify me
          </Button>
        </form>
      </OverlayBody>
    </>
  );
}
