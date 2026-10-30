"use client";
import { BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { productById } from "@/data/catalog";
import { labelById } from "@/data/labels";
import { nowMs } from "@/lib/clock";
import { alternatives } from "@/lib/recs";
import { track } from "@/lib/track";
import { prefsStore, setUI, toast, useUI } from "@/stores/ui";
import { ProductCard } from "./ProductCard";

/** Back-in-stock capture (PRD §7.7) — stored locally; nothing is sent. */
export function NotifyMeHost() {
  const { notifyMe } = useUI();
  const product = notifyMe ? productById[notifyMe.productId] : null;
  return (
    <Overlay open={!!product} onClose={() => setUI({ notifyMe: null })} label="Notify me when back in stock" side="center" panelClassName="sm:w-[min(94vw,560px)] sm:max-h-[90dvh]">
      {product && notifyMe && <NotifyBody key={`${product.id}-${notifyMe.size}`} productId={product.id} size={notifyMe.size} />}
    </Overlay>
  );
}

function NotifyBody({ productId, size }: { productId: string; size?: string }) {
  const product = productById[productId];
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const similar = alternatives(product, 3);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = contact.trim();
    if (!/^[6-9]\d{9}$/.test(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setError("Enter a valid mobile number or email address.");
      return;
    }
    prefsStore.set((p) => ({ ...p, notify: [{ productId, size, contact: v, at: nowMs() }, ...p.notify.filter((n) => !(n.productId === productId && n.size === size))] }));
    track("notify_me", { productId, size });
    toast({ title: "We’ll let you know", description: `${product.name}${size && size !== "One size" ? ` · ${size}` : ""} — back-in-stock alerts are simulated in this prototype.` });
    setUI({ notifyMe: null });
  };
  return (
    <>
      {/* same head as the size guide and reviews drawers — a div, not <header>, so the dialog adds no second banner landmark */}
      <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">Notify me when it’s back</h2>
        <p className="mt-1 truncate text-[13.5px] text-ink-3">{`${labelById[product.labelId].name} · ${product.name}${size && size !== "One size" ? ` · Size ${size}` : ""}`}</p>
      </div>
      <OverlayBody>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Input label="Mobile number or email" autoComplete="email" value={contact} onChange={(e) => (setContact(e.target.value), setError(null))} error={error} hint="One message when it’s back. No marketing." data-autofocus />
          <Button type="submit" full size="lg" icon={<BellRing size={16} />}>
            Notify me
          </Button>
        </form>
        {similar.length > 0 && (
          <section className="mt-8" aria-labelledby="similar-now">
            <h3 id="similar-now" className="mb-4 text-[15px] font-semibold">
              Similar, available now
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} source="notify-similar" hideQuickView sizes="160px" onOpen={() => setUI({ notifyMe: null })} />
              ))}
            </div>
          </section>
        )}
      </OverlayBody>
    </>
  );
}
