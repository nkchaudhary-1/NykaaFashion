import Image from "next/image";
import type { BrandLaunch } from "@/data/launches";
import { cn } from "@/lib/cn";

/**
 * A brand's mark: its logo file when it has one, otherwise its name set as a wordmark. The typeface is always Inter Display — a brand can only vary weight, tracking and
 * case (`brand.wordmark`) — so every launch sits in the site's own voice. The size comes from the surrounding text size (the logo is 1.25em tall).
 */
export function Wordmark({ launch, className }: { launch: BrandLaunch; className?: string }) {
  const { name, logo, wordmark } = launch.brand;
  if (logo) {
    return <Image src={logo} alt={name} width={240} height={60} unoptimized className={cn("inline-block h-[1.25em] w-auto", className)} />;
  }
  return (
    <span className={cn("inline-block whitespace-nowrap leading-none", className)} style={{ fontWeight: wordmark?.weight ?? 500, letterSpacing: wordmark?.tracking ?? "-0.02em", textTransform: wordmark?.upper ? "uppercase" : undefined }}>
      {wordmark?.text ?? name}
    </span>
  );
}
