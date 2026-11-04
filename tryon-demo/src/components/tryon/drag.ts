import type { DragEvent } from "react";

/** MIME type the panel accepts. Any card can become a drag source with garmentDragProps(). */
export const TRYON_DRAG_TYPE = "application/x-tryon-garment";

/** Spread onto a card to let desktop shoppers drag it onto the panel. Buttons stay the primary path. */
export function garmentDragProps(garmentId: string, onDragChange?: (dragging: boolean) => void) {
  return {
    draggable: true as const,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData(TRYON_DRAG_TYPE, garmentId);
      e.dataTransfer.effectAllowed = "copy";
      onDragChange?.(true);
    },
    onDragEnd: () => onDragChange?.(false),
  };
}
