// FLIP card → PDP hero (PRD §7.1/§7.2): the card image's rect and current shot are captured on click;
// the PDP hero animates from that rect to its own, carrying the same shot.
import { prefersReducedMotion } from "./a11y";

interface FlipSource {
  productId: string;
  source: string;
  shot: number;
  rect: { x: number; y: number; w: number; h: number };
  at: number;
}
let source: FlipSource | null = null;

export function captureFlip(productId: string, el: HTMLElement | null, shot: number, from = "grid") {
  if (!el || typeof window === "undefined") return;
  const r = el.getBoundingClientRect();
  source = { productId, source: from, shot, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, at: Date.now() };
}

export function peekFlip(productId: string): FlipSource | null {
  if (!source || source.productId !== productId || Date.now() - source.at > 4000) return null;
  return source;
}

/** Plays the transition on `el` (the hero's final position) and clears the source. */
export function playFlip(productId: string, el: HTMLElement): void {
  const s = peekFlip(productId);
  source = null;
  if (!s || prefersReducedMotion()) {
    el.style.visibility = "";
    return;
  }
  const to = el.getBoundingClientRect();
  if (!to.width || !to.height) {
    el.style.visibility = "";
    return;
  }
  const dx = s.rect.x - to.left;
  const dy = s.rect.y - to.top;
  const sx = s.rect.w / to.width;
  const sy = s.rect.h / to.height;
  el.style.visibility = "";
  el.style.transformOrigin = "top left";
  const anim = el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.92 },
      { transform: "translate(0,0) scale(1,1)", opacity: 1 },
    ],
    { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  anim.onfinish = () => {
    el.style.transformOrigin = "";
  };
}
