import { BadgeCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { Icon: BadgeCheck, label: "Genuine products" },
  { Icon: ShieldCheck, label: "Secure payments" },
  { Icon: RotateCcw, label: "Easy returns" },
];

/** The grey reassurance strip under the price summary: three icons with two-line labels. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-3 gap-3 bg-sand px-4 py-4", className)}>
      {ITEMS.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-[13px] leading-[1.25] text-ink-2">
          <Icon size={28} strokeWidth={1.2} aria-hidden className="shrink-0 text-ink-2" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
