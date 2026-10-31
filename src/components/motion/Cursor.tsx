"use client";
import { useEffect, useRef } from "react";

/**
 * A follower for mouse and trackpad users (decorative: aria-hidden, never blocks a click). A small dot trails the pointer, widens to a ring over
 * links and buttons, and becomes a labelled disc over anything marked `data-cursor="View"` (or "Drag", "Play" …) — the native cursor is hidden only there.
 * Absent on touch screens and with `prefers-reduced-motion`. Flat: a border and an outline, no blend modes or shadows.
 */
const INTERACTIVE = 'a[href], button, summary, [role="button"], [role="tab"], label[for], select, input:not([type="hidden"]), textarea';

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = dot.current;
    const label = text.current;
    if (!el || !label) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let raf = 0;
    let kind = "";
    let caption = "";

    const set = (next: string, name = "") => {
      if (next !== kind) {
        kind = next;
        if (next) el.dataset.kind = next;
        else delete el.dataset.kind;
      }
      if (name !== caption) {
        caption = name;
        label.textContent = name;
      }
    };
    const tick = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!el.dataset.on) {
        cx = x;
        cy = y;
        el.dataset.on = "";
      }
      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) set("label", labelled.dataset.cursor);
      else if (target?.closest(INTERACTIVE)) set("link");
      else set("");
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => (el.dataset.down = "");
    const onUp = () => delete el.dataset.down;
    const onLeave = () => delete el.dataset.on;

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={dot} className="nf-cursor" aria-hidden>
      <span ref={text} />
    </div>
  );
}
