import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Img, type LoadHint } from "@/components/ui/Img";
import { cn } from "@/lib/cn";

/**
 * Image tile with a flat caption strip (no overlay, no gradient). Used for category and edit mosaics:
 * small tiles keep a fixed ratio, the big tile uses ratio="fill" and takes the height of the rows it spans.
 */
export function BentoTile({ href, imgKey, title, meta, ratio = "4/5", sizes, load, size = "md", position, className, onClick }: { href: string; imgKey: string; title: string; meta?: string; ratio?: string; sizes: string; load?: LoadHint; size?: "md" | "lg"; position?: string; className?: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={cn("group block overflow-hidden bg-sand", ratio === "fill" ? "absolute inset-0" : "relative", className)}>
      <Img imgKey={imgKey} alt="" sizes={sizes} ratio={ratio} load={load} position={position} className={cn("transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.03]", ratio === "fill" && "absolute inset-0 h-full")} />
      <span className={cn("absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-white px-3 py-2 text-ink transition-colors group-hover:bg-ink group-hover:text-bone sm:px-4", size === "lg" ? "min-h-16 sm:px-6" : "min-h-14")}>
        <span className="min-w-0">
          {/* two-up phone tiles are ~170px wide: let a long title wrap onto a second line instead of clipping it */}
          <span className={cn("line-clamp-2 block font-medium leading-tight tracking-[-0.02em]", size === "lg" ? "text-[20px] sm:text-[22px]" : "text-[15px] sm:text-[16px]")}>{title}</span>
          {meta && <span className="block truncate text-[12px] leading-tight opacity-70">{meta}</span>}
        </span>
        <ArrowUpRight size={size === "lg" ? 22 : 18} aria-hidden className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
