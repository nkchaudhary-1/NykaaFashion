import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The page grid (see docs/GRID_SYSTEM.md): 4 columns on phones, 12 from 600px up, one column gap (--gap) everywhere.
 * `Col` takes spans per breakpoint — `base` is the 4-column phone grid, `sm` (≥600) and `lg` (≥1024) are 12-column.
 * Class names are spelled out in full so Tailwind can see them.
 */
const BASE = { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4" } as const;
const SM = { 1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4", 5: "sm:col-span-5", 6: "sm:col-span-6", 7: "sm:col-span-7", 8: "sm:col-span-8", 9: "sm:col-span-9", 10: "sm:col-span-10", 11: "sm:col-span-11", 12: "sm:col-span-12" } as const;
const LG = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4", 5: "lg:col-span-5", 6: "lg:col-span-6", 7: "lg:col-span-7", 8: "lg:col-span-8", 9: "lg:col-span-9", 10: "lg:col-span-10", 11: "lg:col-span-11", 12: "lg:col-span-12" } as const;
const SM_START = { 1: "sm:col-start-1", 2: "sm:col-start-2", 3: "sm:col-start-3", 4: "sm:col-start-4", 5: "sm:col-start-5", 6: "sm:col-start-6", 7: "sm:col-start-7", 8: "sm:col-start-8", 9: "sm:col-start-9", 10: "sm:col-start-10", 11: "sm:col-start-11" } as const;
const LG_START = { 1: "lg:col-start-1", 2: "lg:col-start-2", 3: "lg:col-start-3", 4: "lg:col-start-4", 5: "lg:col-start-5", 6: "lg:col-start-6", 7: "lg:col-start-7", 8: "lg:col-start-8", 9: "lg:col-start-9", 10: "lg:col-start-10", 11: "lg:col-start-11" } as const;
const LG_ROW = { 1: "lg:row-span-1", 2: "lg:row-span-2", 3: "lg:row-span-3" } as const;
const SM_ROW = { 1: "sm:row-span-1", 2: "sm:row-span-2", 3: "sm:row-span-3" } as const;
const SM_ROW_START = { 1: "sm:row-start-1", 2: "sm:row-start-2", 3: "sm:row-start-3" } as const;
const LG_ROW_START = { 1: "lg:row-start-1", 2: "lg:row-start-2", 3: "lg:row-start-3" } as const;

export interface Span {
  /** phones (4-column grid) */
  base?: keyof typeof BASE;
  /** ≥600px (12-column grid) */
  sm?: keyof typeof SM;
  /** ≥1024px */
  lg?: keyof typeof LG;
}
export interface Start {
  sm?: keyof typeof SM_START;
  lg?: keyof typeof LG_START;
}
export interface Rows {
  sm?: keyof typeof SM_ROW;
  lg?: keyof typeof LG_ROW;
}
/** Explicit row — needed whenever a tile has a column start, otherwise auto-placement drifts past it and leaves holes. */
export interface RowStart {
  sm?: keyof typeof SM_ROW_START;
  lg?: keyof typeof LG_ROW_START;
}

export function Grid({ as: Tag = "div", className, children, ...rest }: { as?: ElementType; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <Tag className={cn("grid-main", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Col({ as: Tag = "div", span = { base: 4, sm: 12 }, start, rowStart, rows, className, children, ...rest }: { as?: ElementType; span?: Span; start?: Start; rowStart?: RowStart; rows?: Rows; className?: string; children?: ReactNode } & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        span.base && BASE[span.base],
        span.sm && SM[span.sm],
        span.lg && LG[span.lg],
        start?.sm && SM_START[start.sm],
        start?.lg && LG_START[start.lg],
        rowStart?.sm && SM_ROW_START[rowStart.sm],
        rowStart?.lg && LG_ROW_START[rowStart.lg],
        rows?.sm && SM_ROW[rows.sm],
        rows?.lg && LG_ROW[rows.lg],
        "min-w-0",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
