"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { copy, formatPrice } from "@/components/tryon/copy.ts";
import { garmentDragProps } from "@/components/tryon/drag.ts";
import type { Garment } from "@/components/tryon/types.ts";
import { Button } from "@/components/tryon/ui/Button";
import { CheckIcon } from "@/components/tryon/ui/icons";

export type CardPhase = "idle" | "selected" | "live";

/**
 * A try-able product card. States: default, hover, selected/active, dragging (desktop), disabled.
 * The button label never changes ("Try on"); state is carried by aria-pressed and the corner pill, so the
 * accessible name stays stable.
 */
export function GarmentCard({
  garment,
  phase,
  disabled,
  dragging,
  canDrag,
  onTryOn,
  onDragChange,
  priority,
}: {
  garment: Garment;
  phase: CardPhase;
  disabled: boolean;
  dragging: boolean;
  canDrag: boolean;
  onTryOn: (el: Element) => void;
  onDragChange: (dragging: boolean) => void;
  priority?: boolean;
}) {
  const active = phase !== "idle";
  return (
    <article
      data-testid={`card-${garment.id}`}
      data-phase={phase}
      data-dragging={dragging}
      aria-label={garment.name}
      {...(canDrag && !disabled ? garmentDragProps(garment.id, onDragChange) : {})}
      className={cn(
        "group flex h-full min-w-0 flex-col gap-3 rounded-[22px] p-2.5 transition-[background-color,opacity,box-shadow] duration-200",
        active ? "bg-card shadow-[0_0_0_1.5px_var(--color-ink)]" : "hover:bg-card/70",
        dragging && "opacity-50",
        disabled && "opacity-60",
        canDrag && !disabled && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tint">
        <Image
          src={garment.image}
          alt={garment.alt ?? garment.name}
          fill
          priority={priority}
          draggable={false}
          sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 46vw"
          className="select-none object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
        />
        {active && (
          <span
            data-testid={`pill-${garment.id}`}
            className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-xs font-medium leading-none text-paper"
          >
            {phase === "live" && <CheckIcon width={12} height={12} />}
            {phase === "live" ? "On you" : "Selected"}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h3 className="min-w-0 text-[15px] font-medium leading-snug text-ink">{garment.name}</h3>
        <p className="shrink-0 text-[15px] tabular-nums text-ink-2">{formatPrice(garment.price)}</p>
      </div>
      <Button
        variant={active ? "secondary" : "primary"}
        disabled={disabled}
        aria-pressed={active}
        data-testid={`tryon-${garment.id}`}
        onClick={(e) => onTryOn(e.currentTarget)}
        className="mt-auto w-full"
      >
        <span>{copy.tryOn}</span>
        <span className="sr-only">{garment.name}</span>
      </Button>
    </article>
  );
}
