"use client";
import { Heart, Trash2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { EditTile } from "@/components/editorial/EditTile";
import { ProductCard } from "@/components/product/ProductCard";
import { GRID_CLASS } from "@/components/product/ProductGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { productById } from "@/data/catalog";
import { primaryEdits } from "@/data/edits";
import { useHydrated } from "@/lib/store";
import { removeFromWishlist, useWishlist } from "@/stores/commerce";
import { setUI, toast } from "@/stores/ui";
import { ProductRail } from "./Rail";
import { popular } from "@/lib/recs";

export function WishlistView() {
  const ready = useHydrated();
  const items = useWishlist();
  const rows = items.map((i) => ({ item: i, product: productById[i.productId] })).filter((r) => r.product);

  if (!ready) {
    return (
      <div className="container-x" role="status" aria-label="Loading your wishlist">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i}><Skeleton className="aspect-[4/5]" /><Skeleton className="mt-3 h-4 w-2/3" /></div>))}</div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="container-x pb-12">
        <EmptyState
          visual={<Heart size={44} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />}
          title="Nothing saved yet"
          text="Tap the heart on anything you love and it will wait for you here. Start with an edit — someone has already done the choosing."
          actions={<><LinkButton href="/discover" size="lg">Read the Style Files</LinkButton><LinkButton href="/edits" variant="secondary" size="lg">Explore the edits</LinkButton></>}
        />
        <h2 className="eyebrow mb-6 mt-4 text-ink-3">Start here</h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {primaryEdits.slice(0, 3).map((e) => (<li key={e.id}><EditTile edit={e} source="wishlist-empty" sizes="(min-width:600px) 33vw, 100vw" /></li>))}
        </ul>
        <h2 className="eyebrow mb-6 mt-16 text-ink-3">Popular right now</h2>
        <ProductRail products={popular(8)} label="Popular right now" source="wishlist-empty" />
      </div>
    );
  }
  return (
    <div className="container-x">
      <h2 className="sr-only">Saved pieces</h2>
      <ul className={GRID_CLASS}>
        {rows.map(({ item, product }) => (
          <li key={product.id} className="min-w-0">
            <ProductCard
              product={product}
              variant={item.variant}
              source="wishlist"
              hideQuickView
              footer={
                <div className="mt-3 flex gap-2">
                  {product.soldOut ? (
                    <Button variant="secondary" size="sm" full onClick={() => setUI({ notifyMe: { productId: product.id } })}>Notify me</Button>
                  ) : (
                    <Button variant="secondary" size="sm" full onClick={() => setUI({ quickView: { productId: product.id, variant: item.variant } })}>Move to bag</Button>
                  )}
                  <button type="button" aria-label={`Remove ${product.name} from wishlist`} onClick={() => (removeFromWishlist(product.id), toast({ title: "Removed from wishlist", description: product.name }))} className="inline-flex size-9 shrink-0 items-center justify-center border border-line-strong text-ink-2 transition-colors hover:border-danger hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
