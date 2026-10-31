import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Fade, RevealText } from "@/components/motion/reveal";
import { Img } from "@/components/ui/Img";
import { cn } from "@/lib/cn";

/*
 * The pieces of the full-bleed home layout (docs/BLEED_LAYOUT.md). A <Wall> is a zero-gap grid whose cells touch; every <Tile> in it is one cell:
 *   b — a base cell, 4:5      f — a feature, four base cells (2×2)      q — four across from 600px, two on phones (4:5, for pictures)
 *   s — the same count for flat colour tiles, shorter (6:5; 1.6:1 on phones)      w — a banner across the whole wall
 * Fill a wall in blocks of twelve base cells (or a multiple of four "q" / "s" tiles, or one "w") and it makes a complete rectangle at every width — see the grid CSS in globals.css.
 * Text never sits on a picture directly: it goes on a solid strip (<Strip>) at the foot of the tile, or the tile is a flat colour (<Flat>).
 */

export type Cell = "b" | "f" | "q" | "s" | "w";
const CELL: Record<Cell, string> = { b: "bleed-b", f: "bleed-f", q: "bleed-q", s: "bleed-s", w: "bleed-w" };

/** The wall: a container (for the cell unit) around a grid with no gap. Extra props (data-category-grid …) go on the list. */
export function Wall({ children, className, label, ...rest }: { children: ReactNode; className?: string; label?: string } & Record<string, unknown>) {
  return (
    <div className="bleed-wall" data-nogrid>
      <ul aria-label={label} className={cn("bleed-grid", className)} {...rest}>
        {children}
      </ul>
    </div>
  );
}

/** One cell. It fades in as it enters the screen (movement would fight a picture that touches its neighbours). */
export function Tile({ cell = "b", delay, className, children }: { cell?: Cell; delay?: number; className?: string; children: ReactNode }) {
  return (
    <Fade as="li" delay={delay} className={cn("bleed-tile group/tile", CELL[cell], className)}>
      {children}
    </Fade>
  );
}

/** The picture of a tile: fills the cell and scales ever so slowly under the pointer (inside the clipped tile, so the wall never moves). */
export function Pic({ imgKey, sizes, load, position, className }: { imgKey: string; sizes: string; load?: "eager"; position?: string; className?: string }) {
  return <Img imgKey={imgKey} alt="" sizes={sizes} ratio="fill" load={load} position={position} className={cn("absolute inset-0 h-full w-full", className)} imgClassName="transition-transform duration-[1200ms] ease-expo group-hover/tile:scale-[1.04] group-focus-visible/tile:scale-[1.04]" />;
}

/** The solid strip at the foot of a tile that carries its words. `chip` is a small flat label that sits on the picture just above the strip (a reason, a rating). */
export function Strip({ children, chip, className }: { children: ReactNode; chip?: ReactNode; className?: string }) {
  return (
    <span data-strip className="absolute inset-x-0 bottom-0 flex flex-col items-start">
      {chip}
      <span className={cn("block w-full bg-white px-3 pb-3 pt-2.5 text-ink sm:px-3.5", className)}>{children}</span>
    </span>
  );
}

/** A tile that is a picture with a strip, linking somewhere. `strip` is the words. */
export function PhotoLink({ href, imgKey, sizes, load, position, strip, onClick, cursor = "View" }: { href: string; imgKey: string; sizes: string; load?: "eager"; position?: string; strip: ReactNode; onClick?: () => void; cursor?: string }) {
  return (
    <Link href={href} onClick={onClick} data-cursor={cursor} className="absolute inset-0 block">
      <Pic imgKey={imgKey} sizes={sizes} load={load} position={position} />
      <Strip>{strip}</Strip>
    </Link>
  );
}

/** A tile that is flat colour with type on it, linking somewhere. Pass colours as CSS values (tokens or a label's own tone). */
export function Flat({ href, bg, fg, light, children, onClick, className, ...rest }: { href: string; bg: string; fg: string; /** the colour is light: keep the dark focus ring */ light?: boolean; children: ReactNode; onClick?: () => void; className?: string } & Record<string, unknown>) {
  const style = { backgroundColor: bg, color: fg } as CSSProperties;
  return (
    <Link href={href} onClick={onClick} style={style} className={cn(!light && "on-dark", "absolute inset-0 flex flex-col justify-between p-3.5 transition-opacity duration-300 hover:opacity-95 sm:p-4", className)} {...rest}>
      {children}
    </Link>
  );
}

/** "Up to 60% off" — the green saving line used on strips. */
export const Saving = ({ off, fallback }: { off: number; fallback: string }) => <span className={cn("block text-[13px] font-semibold", off > 0 ? "text-emerald" : "text-ink-3")}>{off > 0 ? `Up to ${off}% off` : fallback}</span>;

/** The little arrow that ends a strip. */
export const Go = () => <ArrowRight size={15} aria-hidden className="shrink-0 transition-transform duration-300 ease-editorial group-hover/tile:translate-x-1" />;

/** The heading above a wall: on the page grid, so the title lines up with the rest of the site while the pictures below it run edge to edge. */
export function WallHeading({ eyebrow, title, children, className }: { eyebrow: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("container-x flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}>
      <div className="min-w-0">
        <p className="eyebrow text-ink-3">{eyebrow}</p>
        <RevealText as="h2" className="display-md mt-3">
          {title}
        </RevealText>
      </div>
      {children && <div className="flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>}
    </div>
  );
}
