"use client";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Img } from "@/components/ui/Img";
import { Price } from "@/components/ui/Price";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { imgPins } from "@/lib/img";
import { setUI } from "@/stores/ui";
import { SaveButton } from "@/components/product/SaveButton";

/** "Shop this look" — always-visible product list for a shoppable image (works on touch, where hover pins don't). */
export function LookStrip({ imgKey, title = "In this image", label }: { imgKey: string; title?: string; label?: string }) {
  const ids = imgPins(imgKey).map((p) => p.id);
  if (!ids.length) return null;
  return (
    <section aria-label={label ?? title} className="mt-4">
      <p className="eyebrow mb-3 text-ink-3">{title}</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {ids.map((id) => {
          const p = productById[id];
          if (!p) return null;
          return (
            <li key={id} className="group relative flex gap-3 border border-line bg-paper p-2.5 transition-colors hover:border-ink-3">
              <Link href={`/p/${p.slug}`} className="w-[56px] shrink-0" tabIndex={-1} aria-hidden>
                <Img imgKey={p.variants[0].images[0]} alt="" sizes="64px" ratio="4/5" />
              </Link>
              <div className="min-w-0 flex-1 pr-1">
                <p className="eyebrow truncate text-ink-3">{labelById[p.labelId].name}</p>
                <Link href={`/p/${p.slug}`} className="link-u mt-1 block truncate text-[13.5px] text-ink">
                  {p.name}
                </Link>
                <Price price={p.price} mrp={p.mrp} size="sm" className="mt-1" />
              </div>
              <div className="flex shrink-0 flex-col items-end justify-between">
                <SaveButton product={p} source="look" tone="plain" size={18} className="-mr-1.5 -mt-1.5 size-9" />
                <button type="button" onClick={() => setUI({ quickView: { productId: id } })} aria-label={`Quick add ${p.name}`} className="inline-flex h-9 items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-ink hover:underline">
                  <Eye size={13} aria-hidden /> Quick add
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
