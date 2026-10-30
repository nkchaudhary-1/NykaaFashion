import Image from "next/image";
import { cn } from "@/lib/cn";
import { imgAvg, imgSize, imgSrc } from "@/lib/img";

export const SIZES = {
  card: "(min-width:1536px) 20vw, (min-width:1280px) 22vw, (min-width:1024px) 24vw, (min-width:600px) 33vw, 50vw",
  cardWide: "(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:600px) 33vw, 50vw",
  rail: "(min-width:1280px) 20vw, (min-width:1024px) 24vw, (min-width:600px) 38vw, 62vw",
  half: "(min-width:1024px) 50vw, 100vw",
  full: "100vw",
  thumb: "96px",
  tile: "(min-width:1024px) 33vw, (min-width:600px) 50vw, 82vw",
} as const;

interface Props {
  imgKey: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** CSS aspect-ratio of the box (e.g. "4/5"); omit when the parent controls size */
  ratio?: string;
  position?: string;
  cover?: boolean;
}

/** Filled image box with an average-colour placeholder (no layout shift, no blank flash). */
export function Img({ imgKey, alt, sizes, priority, className, imgClassName, ratio, position, cover = true }: Props) {
  const [w, h] = imgSize(imgKey);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ backgroundColor: imgAvg(imgKey), aspectRatio: ratio ?? `${w}/${h}` }}>
      <Image
        src={imgSrc(imgKey)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        className={cn(cover ? "object-cover" : "object-contain", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}
