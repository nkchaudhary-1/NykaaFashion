"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/cn";
import { TryOnController } from "./controller.ts";
import { copy, deniedCopy, errorCopy } from "./copy.ts";
import { TRYON_DRAG_TYPE } from "./drag.ts";
import { isActive } from "./machine.ts";
import type { Garment, SessionState, TryOnEvent, TryOnProvider } from "./types.ts";
import { ConsentCard, DeniedCard, ErrorCard, IdleCard, RequestingCard } from "./ui/CardStates";
import { CameraIcon } from "./ui/icons";
import { SimBadge } from "./ui/SimBadge";
import { Stage } from "./ui/Stage";

export interface TryOnHandle {
  /** Try a garment on. Pass the pressed element so the panel can open from where the shopper pressed. */
  tryOn(garmentId: string, from?: Element | null): void;
  close(): void;
}

export interface TryOnPanelState {
  state: SessionState;
  /** What the shopper last asked for. */
  garmentId: string | null;
  /** What is currently rendered on them. */
  appliedId: string | null;
}

export interface TryOnProps {
  garments: Garment[];
  provider: TryOnProvider;
  /** Ends a live session after this long (cost cap while testing). 0 / undefined = no cap. */
  maxSessionSeconds?: number;
  onEvent?: (event: TryOnEvent) => void;
  onStateChange?: (state: TryOnPanelState) => void;
  className?: string;
  ref?: Ref<TryOnHandle>;
}

/** Keeps the newest callback without re-subscribing effects to it. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * <TryOn> — the reusable live try-on panel. It takes a product list and a provider and runs; it has no dependency
 * on the page around it. Drive it with the ref (`tryOn(id)`), or let shoppers drag a card onto it.
 */
export function TryOn({ garments, provider, maxSessionSeconds = 0, onEvent, onStateChange, className, ref }: TryOnProps) {
  const onStateChangeRef = useLatest(onStateChange);

  const controller = useMemo(
    () => new TryOnController({ provider, maxSessionMs: maxSessionSeconds * 1000 }),
    [provider, maxSessionSeconds],
  );
  // Hand the controller the latest garments / event sink. An effect, so no ref is read during render.
  useEffect(() => {
    controller.configure({ garments, onEvent });
  }, [controller, garments, onEvent]);

  // Browser lifecycle: hidden tab / closed page / unmount all run the same teardown as Close.
  useEffect(() => {
    controller.attach();
    return () => controller.detach();
  }, [controller]);

  const snap = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  const mode = provider.mode;
  const panelRef = useRef<HTMLElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [dropActive, setDropActive] = useState(false);

  const group = snap.state === "idle" ? "idle" : isActive(snap.state) ? "stage" : "card";
  const cameraOn = isActive(snap.state);
  const target = garments.find((g) => g.id === snap.garmentId);

  // ── imperative API ────────────────────────────────────────────────────────
  const tryOn = useCallback(
    (garmentId: string, from?: Element | null) => {
      const panel = panelRef.current;
      if (panel && from) {
        const a = from.getBoundingClientRect();
        const b = panel.getBoundingClientRect();
        setOrigin(`${Math.round(a.left + a.width / 2 - b.left)}px ${Math.round(a.top + a.height / 2 - b.top)}px`);
      }
      controller.tryOn(garmentId);
      // On a phone the panel can sit below the card that was pressed: bring it into view.
      if (panel) {
        const r = panel.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) {
          panel.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
        }
      }
    },
    [controller],
  );
  useImperativeHandle(ref, () => ({ tryOn, close: () => controller.close() }), [tryOn, controller]);

  // Tell the page what is going on (cards show selected / disabled).
  useEffect(() => {
    onStateChangeRef.current?.({ state: snap.state, garmentId: snap.garmentId, appliedId: snap.appliedId });
  }, [snap.state, snap.garmentId, snap.appliedId, onStateChangeRef]);

  // ── screen-reader announcements (imperative, so a repeat message is still announced) ──
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const prevState = useRef<SessionState>("idle");
  const prevApplied = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevState.current;
    const prevId = prevApplied.current;
    prevState.current = snap.state;
    prevApplied.current = snap.appliedId;
    let polite = "";
    let assertive = "";
    switch (snap.state) {
      case "idle":
        if (prev !== "idle") polite = "Try-on closed. Camera off.";
        break;
      case "consent":
        polite = copy.consent.title;
        break;
      case "requesting-permission":
        polite = copy.requesting.title;
        break;
      case "permission-denied": {
        const c = deniedCopy(snap.permissionReason);
        assertive = `${c.title} ${c.body}`;
        break;
      }
      case "connecting":
        polite = copy.connecting.text;
        break;
      case "switching":
        if (target) polite = copy.switching(target.name);
        break;
      case "live": {
        const applied = garments.find((g) => g.id === snap.appliedId);
        if (applied && (prev !== "live" || prevId !== snap.appliedId)) polite = `Live. ${applied.name} is on you.`;
        break;
      }
      case "error": {
        const c = errorCopy(snap.error?.kind, { maxSessionSeconds });
        assertive = `${c.title} ${c.body}`;
        break;
      }
    }
    if (politeRef.current) politeRef.current.textContent = polite;
    if (assertiveRef.current) assertiveRef.current.textContent = assertive;
  }, [snap.state, snap.appliedId, snap.permissionReason, snap.error, target, garments, maxSessionSeconds]);

  // Auto-clear a "couldn't switch" notice.
  useEffect(() => {
    if (!snap.notice) return;
    const t = setTimeout(() => controller.dismissNotice(), 6000);
    return () => clearTimeout(t);
  }, [snap.notice, controller]);

  // ── focus: move to the new state's heading when the shopper's action changes the state ──
  const focusPrev = useRef<SessionState>("idle");
  useEffect(() => {
    const prev = focusPrev.current;
    focusPrev.current = snap.state;
    if (prev === snap.state) return;
    // Hand-offs inside a running session must not steal focus from wherever the shopper is.
    const insideSession = (s: SessionState) => s === "live" || s === "switching";
    if (insideSession(snap.state) && (insideSession(prev) || prev === "connecting")) return;
    const el = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    el?.focus({ preventScroll: true });
  }, [snap.state]);

  // ── fullscreen: native where it exists, a fixed overlay everywhere (iPhone has no element fullscreen) ──
  const nativeFullscreen = useRef(false);
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !snap.fullscreen) return;
    document.documentElement.style.overflow = "hidden";
    if (typeof el.requestFullscreen === "function" && !document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => {
          nativeFullscreen.current = true;
        })
        .catch(() => {
          /* the overlay is already fullscreen enough */
        });
    }
    return () => {
      document.documentElement.style.overflow = "";
      if (document.fullscreenElement === el) {
        nativeFullscreen.current = false;
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, [snap.fullscreen]);
  useEffect(() => {
    // The shopper left native fullscreen with the browser's own Esc / UI.
    const onChange = () => {
      if (!document.fullscreenElement && nativeFullscreen.current) {
        nativeFullscreen.current = false;
        controller.setFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [controller]);
  useEffect(() => {
    // Esc leaves the overlay even when focus has wandered out of the panel.
    if (!snap.fullscreen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") controller.setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [snap.fullscreen, controller]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || snap.state === "idle" || e.defaultPrevented) return;
    e.preventDefault();
    if (snap.fullscreen) controller.setFullscreen(false);
    else if (snap.state === "consent") controller.decline();
    else controller.close();
  };

  // ── drag a card onto the panel (desktop) ───────────────────────────────────
  const isTryOnDrag = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes(TRYON_DRAG_TYPE);
  const onDragOver = (e: DragEvent) => {
    if (!isTryOnDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropActive(true);
  };
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropActive(false);
  };
  const onDrop = (e: DragEvent) => {
    if (!isTryOnDrag(e)) return;
    e.preventDefault();
    setDropActive(false);
    const id = e.dataTransfer.getData(TRYON_DRAG_TYPE);
    if (id) tryOn(id, null);
  };

  const onFrame = useCallback(() => controller.notifyFrame(), [controller]);
  const stageActions = useMemo(
    () => ({
      tryOn: (id: string) => controller.tryOn(id),
      close: () => controller.close(),
      toggleFullscreen: () => controller.setFullscreen(!controller.getSnapshot().fullscreen),
      onFrame,
    }),
    [controller, onFrame],
  );

  return (
    // The wrapper reserves the panel's footprint so the page does not jump when the panel goes fullscreen.
    <div className={cn("relative aspect-[3/4] w-full sm:aspect-[4/3]", className)}>
      <section
        ref={panelRef}
        aria-label={copy.panelLabel}
        data-testid="tryon-panel"
        data-state={snap.state}
        data-mode={mode}
        data-fullscreen={snap.fullscreen}
        onKeyDown={onKeyDown}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ "--panel-origin": origin } as React.CSSProperties}
        className={cn(
          "isolate overflow-hidden bg-card text-ink",
          snap.fullscreen
            ? "fixed inset-0 z-50 h-dvh w-screen"
            : "absolute inset-0 rounded-[28px] border border-line shadow-[0_1px_0_rgba(26,24,20,0.04),0_18px_40px_-24px_rgba(26,24,20,0.28)]",
          dropActive && !snap.fullscreen && "ring-2 ring-focus ring-offset-2 ring-offset-paper",
        )}
      >
        <div ref={politeRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
        <div ref={assertiveRef} className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" />

        <div key={group} className={cn("absolute inset-0", group !== "idle" && "anim-panel-in")}>
          {group === "idle" && <IdleCard dropActive={dropActive} />}
          {snap.state === "consent" && (
            <ConsentCard mode={mode} garment={target} onAgree={() => controller.agree()} onDecline={() => controller.decline()} />
          )}
          {snap.state === "requesting-permission" && <RequestingCard onCancel={() => controller.close()} />}
          {snap.state === "permission-denied" && (
            <DeniedCard reason={snap.permissionReason} onRetry={() => controller.retry()} onClose={() => controller.close()} />
          )}
          {snap.state === "error" && (
            <ErrorCard
              kind={snap.error?.kind}
              maxSessionSeconds={maxSessionSeconds}
              onRetry={() => controller.retry()}
              onClose={() => controller.close()}
            />
          )}
          {group === "stage" && <Stage snap={snap} garments={garments} mode={mode} actions={stageActions} />}
        </div>

        {/* Status stack: always above the content. The Simulation badge is present whenever this is not the real model. */}
        <div className="pad-safe-top pad-safe-x pointer-events-none absolute left-0 top-0 z-20 flex flex-col items-start gap-2">
          {mode === "sim" && (
            <div className="pointer-events-auto">
              <SimBadge />
            </div>
          )}
          {cameraOn && (
            <span
              data-testid="camera-indicator"
              className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[13px] font-medium leading-none text-on-stage backdrop-blur"
            >
              <span aria-hidden="true" className="pulse-dot h-2 w-2 rounded-full bg-signal" />
              <CameraIcon width={14} height={14} />
              {copy.cameraOn}
            </span>
          )}
        </div>

        {dropActive && group !== "idle" && (
          <div
            aria-hidden="true"
            className="anim-fade pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-[22px] border-2 border-dashed border-focus-stage bg-black/55 font-serif text-3xl text-on-stage"
          >
            {copy.idle.drop}
          </div>
        )}
      </section>
    </div>
  );
}
