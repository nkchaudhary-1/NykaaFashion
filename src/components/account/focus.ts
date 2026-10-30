/**
 * A card is about to leave a list (deleted, removed): hand focus to its neighbour's first button — the "add" tile always closes
 * these lists, so there is one — or to the page when there is none, so a keyboard user keeps their place instead of
 * restarting from the top of the document. Call it before the removal; it reads the DOM now and moves focus a frame later.
 */
export function focusNeighbour(from: HTMLElement) {
  const li = from.closest("li");
  const next = li?.nextElementSibling ?? li?.previousElementSibling;
  const target = (next?.querySelector<HTMLElement>("button") ?? document.getElementById("main")) as HTMLElement | null;
  requestAnimationFrame(() => target?.focus({ preventScroll: true }));
}
