"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Img } from "@/components/ui/Img";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { imgSrc } from "@/lib/img";
import { launchNow } from "@/lib/launch-clock";
import { pickPromo, type PromoView } from "@/lib/promo";
import { useStore } from "@/lib/store";
import { track } from "@/lib/track";
import { dismissPromo, engagePromo, markPromoShown, promoForceStore, promoStore, promoVisitStore } from "@/stores/promo";
import { useUI } from "@/stores/ui";

/*
 * The pop-up (PiP): a small floating window — an image or a muted, looping video — that points at a launch, a collection, an offer or an announcement.
 * Which campaign, where and when is src/lib/promo.ts; what the campaigns are is src/data/promos.ts; this file draws the window and runs the clock.
 *
 *  • Calm by construction: it appears after a few seconds on browsing pages only, waits while a drawer or dialog is open, never takes focus, never
 *    covers the phone's bottom bar, and goes away for good (days, not minutes) when closed.
 *  • Phones get a docked mini window (a thumbnail beside the words); tablets and desktops a small portrait window in the bottom-right corner.
 *  • Video starts muted and loops, pauses when the tab is hidden or a dialog covers it, and does not autoplay for visitors who prefer reduced motion
 *    or have data saver on (they get the still and a Play button). A clip with sound gets a mute button.
 *  • The whole window is the link; Close (always there, 44px hit area, Escape too) is the only other thing it asks of you.
 */
const TICK_MS = 30_000;
const EASE = [0.22, 1, 0.36, 1] as const;

const subscribeNothing = () => () => {};
const saveDataNow = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const useSaveData = () => useSyncExternalStore(subscribeNothing, saveDataNow, () => false);

const sameView = (a: PromoView, b: PromoView) => a.headline === b.headline && a.meta === b.meta && a.eyebrow === b.eyebrow && a.cta.href === b.cta.href && a.cta.label === b.cta.label && a.state === b.state;

export function PromoPip() {
  const pathname = usePathname();
  const memory = useStore(promoStore);
  const visit = useStore(promoVisitStore);
  const forced = useStore(promoForceStore).id;
  const ui = useUI();
  const overlayOpen = ui.bagOpen || ui.searchOpen || ui.menuOpen || ui.navOpen || ui.protoOpen || ui.loginOpen || !!ui.quickView || !!ui.sizeGuide || !!ui.notifyMe || !!ui.reviewFor;
  const [view, setView] = useState<PromoView | null>(null);
  const [pinned, setPinned] = useState<string | null>(null); // a campaign someone asked for (panel, ?promo=): it stays until closed, whatever the page's own rules say
  const [tick, setTick] = useState(0); // re-asks now and then (the countdown, a campaign's end) and when the tab comes back
  const consumed = useRef(new Set<string>()); // ?promo= campaigns already shown once on this page load, so closing one does not bring it straight back

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const id = window.setInterval(bump, TICK_MS);
    document.addEventListener("visibilitychange", bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
    };
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("promo"); // ?promo=<id> shows that campaign now, ?promo=off none
    const want = pinned ?? (q && q !== "off" && !consumed.current.has(q) ? q : forced);
    const ask = () => pickPromo({ now: launchNow(), realNow: Date.now(), pathname, memory, shown: visit.shown, force: want, keep: view?.id });
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => void timers.push(window.setTimeout(fn, ms));

    const next = q === "off" ? null : ask();
    if (!next) {
      if (view) later(() => setView(null), 0);
    } else if (view && view.id === next.id) {
      if (!sameView(view, next)) later(() => setView(next), 0);
    } else if (view) {
      later(() => setView(null), 0); // swap: the old one leaves first; this effect runs again and schedules the new one
    } else if (!overlayOpen) {
      later(() => {
        if (document.visibilityState === "hidden") return; // comes back through the tab's visibilitychange tick
        const again = ask();
        if (!again || again.id !== next.id) return;
        if (want) {
          if (q && again.id === q) consumed.current.add(q);
          if (forced) promoForceStore.set({ id: null });
          setPinned(again.id);
        }
        markPromoShown(again.id);
        track("promo_view", { id: again.id, kind: again.kind });
        setView(again);
      }, want ? 0 : next.delaySeconds * 1000);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pathname, memory, visit, forced, overlayOpen, view, pinned, tick]);

  const close = (how: "dismiss" | "open") => {
    if (!view) return;
    const hadFocus = !!document.activeElement && !!document.querySelector(`[data-promo="${view.id}"]`)?.contains(document.activeElement);
    track(how === "dismiss" ? "promo_dismiss" : "promo_click", { id: view.id, kind: view.kind });
    if (how === "dismiss") dismissPromo(view.id);
    else engagePromo(view.id);
    setPinned(null);
    setView(null);
    if (how === "dismiss" && hadFocus) document.getElementById("main")?.focus({ preventScroll: true }); // the focused button is leaving: do not drop the keyboard user at the top of the page
  };

  return <AnimatePresence>{view && <Window key={view.id} view={view} suspended={overlayOpen} onDismiss={() => close("dismiss")} onOpen={() => close("open")} />}</AnimatePresence>;
}

function Window({ view, suspended, onDismiss, onOpen }: { view: PromoView; suspended: boolean; onDismiss: () => void; onOpen: () => void }) {
  const reduce = usePrefersReducedMotion();
  const saveData = useSaveData();
  const { media } = view;
  const video = media.type === "video" && (media.video?.mp4 || media.video?.webm) ? media.video : null;
  const hasAudio = !!video?.hasAudio;
  const ratio = media.ratio ?? "4/3";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wantPlay, setWantPlay] = useState(!(reduce || saveData)); // the visitor's choice; starts as "play" unless motion is unwelcome
  const [muted, setMuted] = useState(true);
  const [tabShown, setTabShown] = useState(true);

  useEffect(() => {
    const on = () => setTabShown(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (wantPlay && !suspended && tabShown) v.play().catch(() => setWantPlay(false)); // refused (autoplay policy, low power): show the still and a Play button
    else v.pause();
  }, [wantPlay, suspended, tabShown, muted]);

  const sizes = "(min-width:1024px) 264px, (min-width:600px) 200px, 76px";
  return (
    <motion.aside
      aria-label={`Promotion: ${view.headline}`}
      data-promo={view.id}
      data-kind={view.kind}
      data-media={media.type}
      initial={{ opacity: 0, y: reduce ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 10, transition: { duration: reduce ? 0.01 : 0.22, ease: EASE } }}
      transition={{ duration: reduce ? 0.01 : 0.55, ease: EASE }}
      onKeyDown={(e) => e.key === "Escape" && onDismiss()}
      className={cn(
        "group fixed z-[48] border border-ink bg-bone print:hidden",
        // the phone's bottom bar and a product page's sticky bar own the bottom edge — sit above them, like the toasts do
        "bottom-[calc(var(--bottom-nav-h)+var(--sticky-h,0px)+env(safe-area-inset-bottom)+12px)] max-sm:left-3 max-sm:right-3 sm:right-4 sm:w-[200px] lg:bottom-6 lg:right-6 lg:w-[264px]",
        "flex max-sm:flex-row sm:flex-col",
      )}
    >
      <div className="relative w-[76px] shrink-0 self-start sm:w-full">
        {/* the picture is a second way to the same place for pointer users; the link in the words below is the one assistive technology and the keyboard use */}
        <Link href={view.cta.href} onClick={onOpen} tabIndex={-1} aria-hidden className="block" data-cursor="View">
          <div className="relative aspect-[var(--r)] overflow-hidden bg-sand max-sm:aspect-square" style={{ "--r": ratio } as CSSProperties}>
            {video ? (
              <video
                ref={videoRef}
                className="absolute inset-0 size-full object-cover"
                poster={imgSrc(media.image)}
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                aria-hidden
                tabIndex={-1}
              >
                {video.mp4 && <source src={video.mp4} type="video/mp4" />}
                {video.webm && <source src={video.webm} type="video/webm" />}
              </video>
            ) : (
              <Img imgKey={media.image} alt={media.alt} sizes={sizes} ratio="fill" className="absolute inset-0" imgClassName="transition-transform duration-[900ms] ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
            )}
          </div>
        </Link>
        {video && (
          <Control label={wantPlay ? "Pause video" : "Play video"} onClick={() => setWantPlay((p) => !p)} className="bottom-0 left-0 max-sm:hidden">
            {wantPlay ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
          </Control>
        )}
        {video && hasAudio && (
          <Control label={muted ? "Unmute video" : "Mute video"} onClick={() => setMuted((m) => !m)} className="max-sm:left-0 max-sm:top-0 sm:bottom-0 sm:left-11">
            {muted ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
          </Control>
        )}
      </div>

      <Link href={view.cta.href} onClick={onOpen} className="flex min-w-0 flex-1 flex-col justify-center p-3 outline-offset-[-3px] max-sm:py-2.5 max-sm:pr-12 sm:p-4">
        <span className="eyebrow block truncate text-[10px] text-ink-3">{view.eyebrow}</span>
        <span className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-[1.2] tracking-[-0.012em] text-ink sm:text-[15px]">{view.headline}</span>
        {view.meta && <span className="mt-1 line-clamp-1 text-[12px] tabular-nums text-ink-2 max-sm:hidden">{view.meta}</span>}
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-300 group-hover:text-pink max-sm:mt-2">
          {view.cta.label}
          <ArrowRight size={13} aria-hidden className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
        </span>
      </Link>

      <button type="button" onClick={onDismiss} aria-label="Close promotion" className="group/close absolute right-0 top-0 inline-flex size-11 items-center justify-center rounded-none text-ink">
        <span className="inline-flex size-7 items-center justify-center bg-bone transition-colors duration-200 group-hover/close:bg-ink group-hover/close:text-bone">
          <X size={15} aria-hidden />
        </span>
      </button>
    </motion.aside>
  );
}

/** A 44px target holding a 28px flat chip — readable over any picture, no shadow or blur needed. */
function Control({ label, onClick, className, children }: { label: string; onClick: () => void; className: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn("group/c absolute inline-flex size-11 items-center justify-center rounded-none text-ink", className)}>
      <span className="inline-flex size-7 items-center justify-center bg-bone transition-colors duration-200 group-hover/c:bg-ink group-hover/c:text-bone">{children}</span>
    </button>
  );
}
