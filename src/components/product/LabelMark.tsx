import type { Label } from "@/data/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

export function LabelMonogram({ label, className, size = "md" }: { label: Label; className?: string; size?: "sm" | "md" | "lg" }) {
  const letters = label.name.replace(/[^A-Za-z& ]/g, "").split(/\s+/).filter((w) => w && w !== "&" && w.toLowerCase() !== "by").slice(0, 2).map((w) => w[0]).join("");
  return (
    <span aria-hidden className={cn("inline-flex items-center justify-center font-medium leading-none", size === "lg" ? "size-28 text-[56px]" : size === "md" ? "size-16 text-[32px]" : "size-10 text-[20px]", className)} style={{ background: label.tone.bg, color: label.tone.fg }}>
      {letters}
    </span>
  );
}

export function LabelBadges({ label, className }: { label: Label; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap gap-1.5", className)}>
      {label.flags.hiddenGem && <Badge tone="gold">Hidden Gem</Badge>}
      {label.flags.luxe && <Badge tone="ink">Luxe</Badge>}
      {label.flags.houseOfNykaa && <Badge tone="pink">House of Nykaa</Badge>}
      {label.flags.responsible && <Badge tone="emerald">Responsible</Badge>}
    </span>
  );
}
