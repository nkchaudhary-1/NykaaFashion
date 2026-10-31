"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SaveButton } from "@/components/product/SaveButton";
import { ColourChooser } from "@/components/product/SizeSelector";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Img, SIZES } from "@/components/ui/Img";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { Price } from "@/components/ui/Price";
import { productBySlug } from "@/data/catalog";
import { isLaunched, launchAtMs, launchById, launchOfProduct, launchOfSlug, type BrandLaunch } from "@/data/launches";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { useLaunchReady, useLaunchTime } from "./clock";
import { NotifyButton } from "./Notify";
import { closePiece, openPiece, usePiece } from "./sheet";
import { dateTimeLine } from "./time";

/**
 * The preview sheet: a closer look at a piece before it is on sale — its own pictures, price, colours, the size range, fabric, fit and description, a wishlist heart and
 * Notify me. No size picker, no Add to bag (the bag refuses it until launch day). One <PieceHost /> per page; any card opens it with `openPiece(slug)`, and `?piece=<slug>` in
 * the address — where the server sends a piece's product page until launch day — opens it on arrival. The address follows the sheet, so a piece can be shared.
 */
export function PieceHost() {
  const slug = usePiece();
  const product = slug ? productBySlug[slug] : null;
  const launch = product ? launchById[launchOfProduct[product.id]] : null;
  const was = useRef<string | null>(null);

  // keep ?piece= in step with the sheet: set when it opens, removed when it closes (not on arrival, where it is what opens the sheet)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("piece", slug);
    else if (was.current) url.searchParams.delete("piece");
    else return;
    was.current = slug;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [slug]);

  return (
    <Overlay open={!!(product && launch)} onClose={closePiece} label={product ? `Preview: ${product.name}` : "Preview"} side="center" panelClassName="sm:w-[min(94vw,940px)] sm:max-h-[90dvh]">
      {product && launch && <SheetBody key={product.id} product={product} launch={launch} />}
    </Overlay>
  );
}

/**
 * Opens the sheet for `?piece=<slug>` — once the browser's clock is known, so a piece whose brand has gone live is sent to its real product page instead of being shown as a preview.
 * It renders nothing; keep it in its own <Suspense> (useSearchParams), so the rest of the page is still prerendered.
 */
export function PieceFromUrl() {
  const slug = useSearchParams().get("piece");
  const router = useRouter();
  const time = useLaunchTime();
  const ready = useLaunchReady();
  useEffect(() => {
    if (!slug || !ready) return;
    const launch = launchById[launchOfSlug[slug]];
    if (!launch) return;
    if (isLaunched(launch, time)) router.replace(`/p/${slug}`);
    else openPiece(slug);
  }, [slug, time, ready, router]);
  return null;
}

function SheetBody({ product, launch }: { product: Product; launch: BrandLaunch }) {
  const time = useLaunchTime();
  const live = isLaunched(launch, time);
  const [variant, setVariant] = useState(0);
  const [shot, setShot] = useState(0);
  const v = product.variants[variant];
  const at = Math.min(shot, v.images.length - 1);
  const sizes = product.sizes.length > 1 ? `${product.sizes[0]} – ${product.sizes[product.sizes.length - 1]}` : "One size";

  return (
    <OverlayBody flush>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* the piece's own pictures */}
        <div className="bg-sand">
          <Img imgKey={v.images[at]} alt={`${product.name} in ${v.colorName}`} sizes={SIZES.half} ratio="4/5" load="eager" className="max-sm:max-h-[44dvh]" imgClassName="max-sm:object-contain" />
          {v.images.length > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-line bg-paper px-4 py-1 sm:px-5">
              <p aria-live="polite" className="text-[12px] tabular-nums text-ink-3">
                Image {at + 1} of {v.images.length}
              </p>
              <div className="flex gap-1.5">
                {v.images.map((img, i) => (
                  <button key={img} type="button" aria-label={`Show image ${i + 1} of ${v.images.length}`} aria-pressed={at === i} onClick={() => setShot(i)} className="flex h-11 w-9 items-center">
                    <span className={cn("block h-[3px] w-full transition-colors", at === i ? "bg-pink" : "bg-line-strong")} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-8">
          <div className="pr-10 sm:pr-8">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Badge tone="ink">{live ? "Now on sale" : "Preview"}</Badge>
              <span className="text-[12.5px] text-ink-3">{live ? "Launched" : "Opens"} {dateTimeLine(launchAtMs(launch))}</span>
            </p>
            <Link href={`/new-and-next/${launch.id}`} onClick={closePiece} className="eyebrow tap mt-5 block text-ink transition-colors duration-300 hover:text-pink-ink">
              {launch.brand.name}
            </Link>
            <h2 className="display-sm mt-3">{product.name}</h2>
            <Price price={product.price} mrp={product.mrp} size="lg" className="mt-3" />
          </div>

          {product.variants.length > 1 && <ColourChooser product={product} value={variant} onChange={(i) => (setVariant(i), setShot(0))} compact />}

          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2.5 border-t border-line pt-5 text-[13.5px] leading-snug">
            <dt className="eyebrow pt-0.5 text-ink-3">Sizes</dt>
            <dd className="text-ink">{sizes}</dd>
            <dt className="eyebrow pt-0.5 text-ink-3">Fabric</dt>
            <dd className="text-ink">{product.fabric}</dd>
            <dt className="eyebrow pt-0.5 text-ink-3">Fit</dt>
            <dd className="text-ink">{product.fit}</dd>
          </dl>
          <p className="text-[14px] leading-relaxed text-ink-2">{product.description}</p>

          <div className="mt-auto flex flex-col gap-3 pt-1">
            <div className="flex items-stretch gap-2">
              {live ? (
                <LinkButton href={`/p/${product.slug}`} size="lg" full iconRight={<ArrowRight size={16} aria-hidden />} onClick={closePiece}>
                  Shop this piece
                </LinkButton>
              ) : (
                <NotifyButton launch={launch} full />
              )}
              <SaveButton product={product} variant={variant} source="launch-sheet" tone="plain" size={22} className="size-12 shrink-0 border border-ink" />
            </div>
            {!live && <p className="text-[12.5px] leading-snug text-ink-3">Save it now — it waits on your Wishlist and goes on sale at launch. Not purchasable until then.</p>}
          </div>
        </div>
      </div>
    </OverlayBody>
  );
}
