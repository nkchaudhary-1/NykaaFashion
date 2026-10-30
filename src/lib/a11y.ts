import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let locks = 0;
function lockScroll() {
  if (locks++ === 0) {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", `${sbw}px`);
    document.documentElement.dataset.scrollLock = "true";
  }
}
function unlockScroll() {
  if (--locks <= 0) {
    locks = 0;
    delete document.documentElement.dataset.scrollLock;
    document.documentElement.style.removeProperty("--sbw");
  }
}

/** Locks page scroll while `active`. Ref-counted so nested overlays behave. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockScroll();
    return unlockScroll;
  }, [active]);
}

/** Traps Tab inside `ref`, closes on Escape, restores focus to the opener on close. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = root.querySelector<HTMLElement>("[data-autofocus]") ?? items()[0] ?? root;
    // Defer so enter animations / portals have mounted.
    const raf = requestAnimationFrame(() => first.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        escRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const a = list[0];
      const z = list[list.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [ref, active]);
}

/** Closes when the user clicks outside `ref`. */
export function useOutsideClick(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  const cb = useRef(onOutside);
  useEffect(() => {
    cb.current = onOutside;
  });
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, active]);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
