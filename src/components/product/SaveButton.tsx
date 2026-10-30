"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { saveWithFeedback } from "@/lib/actions";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";
import { useIsSaved } from "@/stores/commerce";

/** Heart toggle: 44px target, aria-pressed, pop animation + instant toast. */
export function SaveButton({ product, variant = 0, source = "card", className, tone = "light", size = 20 }: { product: Product; variant?: number; source?: string; className?: string; tone?: "light" | "plain"; size?: number }) {
  const saved = useIsSaved(product.id);
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        saveWithFeedback(product, variant, source);
        setPop((n) => n + 1);
      }}
      className={cn("inline-flex size-10 items-center justify-center transition-colors duration-200 [@media(pointer:coarse)]:size-11", tone === "light" ? "bg-white text-ink hover:bg-bone" : "text-ink hover:bg-sand", className)}
    >
      <Heart key={pop} size={size} strokeWidth={1.6} className={cn("transition-colors duration-200", saved ? "fill-pink stroke-pink" : "fill-transparent", pop > 0 && saved && "animate-pop")} />
    </button>
  );
}
