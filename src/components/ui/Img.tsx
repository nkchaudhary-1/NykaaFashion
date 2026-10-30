import Image from "next/image";
import { cn } from "@/lib/cn";
import { imgAvg, imgBlur, imgSize, imgSrc } from "@/lib/img";

export const SIZES = {
  card: "(min-width:1536px) 20vw, (min-width:1280px) 22vw, (min-width:1024px) 24vw, (min-width:600px) 33vw, 50vw",
  cardWide: "(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:600px) 33vw, 50vw",
  rail: "(min-width:1280px) 20vw, (min-width:1024px) 24vw, (min-width:600px) 38vw, 62vw",
  half: "(min-width:1024px) 50vw, 100vw",
  full: "100vw",
  thumb: "96px",
  tile: "(min-width:1024px) 33vw, (min-width:600px) 50vw, 82vw",
} as const;

/**
 * How eagerly an image loads. Default is lazy.
 * - "preload": `<link rel=preload>` + high priority — ONE definite LCP image that is visible at every viewport.
 * - "eager": loads immediately at high priority, no extra tag — above-the-fold images when there are several (first grid row).
 * - "high": still lazy (a `display:none` copy never downloads) but fetched first once in view — for images that only exist at some breakpoints.
 */
export type LoadHint = "preload" | "eager" | "high";

interface Props {
  imgKey: string;
  alt: string;
  sizes: string;
  load?: LoadHint;
  className?: string;
  imgClassName?: string;
  /** CSS aspect-ratio of the box (e.g. "4/5"); omit when the parent controls size */
  ratio?: string;
  position?: string;
  cover?: boolean;
}

/** Filled image box with an average-colour placeholder (no layout shift, no blank flash). */
export function Img({ imgKey, alt, sizes, load, className, imgClassName, ratio, position, cover = true }: Props) {
  const [w, h] = imgSize(imgKey);
  const blur = imgBlur(imgKey); // tiny inline preview exists for the large editorial covers only
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ backgroundColor: imgAvg(imgKey), aspectRatio: ratio ?? `${w}/${h}` }}>
      <Image
        src={imgSrc(imgKey)}
        alt={alt}
        fill
        sizes={sizes}
        placeholder={blur ? "blur" : "empty"}
        blurDataURL={blur}
        preload={load === "preload"}
        loading={load === "eager" ? "eager" : undefined}
        fetchPriority={load ? "high" : undefined}
        className={cn(cover ? "object-cover" : "object-contain", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}
