import Link from "next/link";
import { cn } from "@/lib/cn";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";

/**
 * The Nykaa Fashion wordmark — the supplied artwork, inlined so it can be recoloured: NYKAA in the brand magenta, FASHION in the
 * logo's own near-black; `onDark` renders it all white (login band, dark strips). `md` is the header size, `lg` the dialog size.
 */
export function Logo({ className, onDark, size = "md" }: { className?: string; onDark?: boolean; size?: "md" | "lg" }) {
  return (
    <Link href="/" aria-label="Nykaa Fashion home" className={cn("tap inline-flex items-center", className)}>
      <svg aria-hidden viewBox={LOGO_VIEWBOX} className={cn("block w-auto", size === "lg" ? "h-8" : "h-[22px]")}>
        {LOGO_PATHS.map((p) => (
          <path key={p.d.slice(0, 24)} d={p.d} className={onDark ? "fill-white" : p.tone === "brand" ? "fill-brand" : "fill-[#242021]"} />
        ))}
      </svg>
    </Link>
  );
}
