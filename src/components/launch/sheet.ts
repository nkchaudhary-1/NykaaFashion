import { useSyncExternalStore } from "react";

/** Which piece's preview sheet is open (a product slug), shared by every card on the page. One <PieceHost /> per page renders it. */
let piece: string | null = null;
const subs = new Set<() => void>();
const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => void subs.delete(cb);
};
const set = (slug: string | null) => {
  if (piece === slug) return;
  piece = slug;
  subs.forEach((f) => f());
};
export const openPiece = (slug: string) => set(slug);
export const closePiece = () => set(null);
export const usePiece = () =>
  useSyncExternalStore(
    subscribe,
    () => piece,
    () => null,
  );
