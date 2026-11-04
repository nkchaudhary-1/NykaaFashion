import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "stage" | "icon";

const styles: Record<Variant, string> = {
  // Ink on paper: the single, restrained primary action.
  primary: "bg-ink text-paper hover:bg-black active:scale-[0.98]",
  secondary: "border border-ink/25 bg-transparent text-ink hover:border-ink/60 hover:bg-ink/[0.04]",
  // On the dark stage: a solid light button keeps contrast on any video behind it.
  stage: "bg-on-stage text-ink hover:bg-white active:scale-[0.98]",
  // Round controls over live video. A dark scrim, not a transparent icon, so they read on any frame.
  icon: "h-11 w-11 justify-center rounded-full bg-black/60 text-on-stage backdrop-blur hover:bg-black/75 active:scale-95",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 text-[15px] font-medium leading-none transition-[background-color,border-color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant !== "icon" && "justify-center rounded-full px-5",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
