import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "inverse" | "danger" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none font-medium uppercase tracking-[0.1em] text-[12px] leading-none transition-[background-color,color,border-color,transform,opacity] duration-300 ease-editorial active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";
const SIZES: Record<ButtonSize, string> = { sm: "h-9 px-4", md: "h-11 px-6", lg: "h-[52px] px-8 text-[12.5px]" };
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-bone hover:bg-[#2f2822]",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-bone",
  ghost: "text-ink hover:bg-sand",
  accent: "bg-pink-ink text-white hover:bg-[#8c0046]",
  inverse: "bg-bone text-ink hover:bg-white",
  danger: "border border-danger text-danger hover:bg-danger hover:text-white",
  "outline-light": "border border-bone/70 text-bone hover:bg-bone hover:text-ink",
};

export function buttonClass({ variant = "primary", size = "md", full, className }: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string } = {}) {
  return cn(BASE, SIZES[size], VARIANTS[variant], full && "w-full", className);
}

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({ variant, size, full, icon, iconRight, loading, children, className, type = "button", ...rest }: Common & { loading?: boolean } & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass({ variant, size, full, className })} aria-busy={loading || undefined} {...rest} disabled={rest.disabled || loading}>
      {loading ? <Spinner className="size-4" /> : icon}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}

export function LinkButton({ variant, size, full, icon, iconRight, children, className, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, full, className })} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}

export function IconButton({ label, children, className, badge, ...rest }: { label: string; badge?: number } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 hover:bg-sand active:bg-stone/60", className)}
      {...rest}
    >
      {children}
      {badge ? <CountBadge n={badge} /> : null}
    </button>
  );
}

export function CountBadge({ n, className }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={cn("absolute right-1 top-1 inline-flex min-w-[17px] items-center justify-center rounded-full bg-pink-ink px-1 text-[10px] font-semibold leading-[17px] text-white", className)}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Text link with an animated underline. */
export function TextLink({ href, children, className, ...rest }: ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn("link-u inline-flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.1em]", className)} {...rest}>
      {children}
    </Link>
  );
}
