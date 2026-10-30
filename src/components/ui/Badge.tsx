import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ink" | "pink" | "emerald" | "amber" | "gold" | "danger" | "outline" | "light";
const TONES: Record<Tone, string> = {
  neutral: "bg-sand text-ink-2",
  ink: "bg-ink text-bone",
  pink: "bg-pink-ink text-white",
  emerald: "bg-emerald-tint text-emerald",
  amber: "bg-amber-tint text-amber",
  gold: "bg-gold-tint text-gold-ink",
  danger: "bg-danger-tint text-danger",
  outline: "border border-line-strong text-ink-2",
  light: "bg-white/90 text-ink backdrop-blur",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1 whitespace-nowrap px-2 text-[10px] font-medium uppercase leading-none tracking-[0.12em]", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
