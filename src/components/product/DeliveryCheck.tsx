"use client";
import { MapPin, Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { COD_FEE, FREE_SHIPPING_THRESHOLD, lookupPincode } from "@/data/commerce";
import { DAY, useNow } from "@/lib/clock";
import { fmtDate, inr } from "@/lib/format";
import { createStore, useStore } from "@/lib/store";

export const pinStore = createStore<string>("nf.pin", "");

/** Simulated serviceability + delivery estimate (PRD §5.5 "pattern-only"). */
export function DeliveryCheck() {
  const saved = useStore(pinStore);
  const [draft, setDraft] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const now = useNow();
  const value = draft ?? saved;
  const result = saved ? lookupPincode(saved) : null;
  const formatError = touched && draft !== null && !/^\d{6}$/.test(draft);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (/^\d{6}$/.test(value)) {
      pinStore.set(value);
      setDraft(null);
    }
  };

  return (
    <section aria-labelledby="deliv" className="border-y border-line py-5">
      <h2 id="deliv" className="flex items-center gap-2 text-[13px] font-medium">
        <Truck size={16} aria-hidden /> Delivery
      </h2>
      <form onSubmit={submit} noValidate className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            aria-label="Delivery pincode"
            aria-invalid={formatError || undefined}
            aria-describedby="pin-msg"
            placeholder="Enter pincode"
            value={value}
            onChange={(e) => (setDraft(e.target.value.replace(/\D/g, "")), setTouched(false))}
            className="h-11 w-full border border-line-strong bg-white pl-10 pr-3 text-[14px] tabular-nums focus:border-ink focus:outline-none"
          />
        </div>
        <Button type="submit" variant="secondary" size="md">
          Check
        </Button>
      </form>
      <div id="pin-msg" aria-live="polite" className="mt-3 min-h-5 text-[13px]">
        {formatError ? (
          <p role="alert" className="font-medium text-danger">Enter a valid 6-digit pincode.</p>
        ) : result?.ok ? (
          <div className="space-y-1">
            <p>
              Delivery by <strong className="font-medium">{fmtDate(now + result.area.days * DAY, { weekday: "short", day: "numeric", month: "short" })}</strong> to {result.area.city === "Your area" ? saved : `${result.area.city}, ${saved}`}
            </p>
            <p className="text-ink-3">
              Free above {inr(FREE_SHIPPING_THRESHOLD)} · {result.area.cod ? `Cash on delivery available (${inr(COD_FEE)} fee)` : "Cash on delivery not available here"}
            </p>
          </div>
        ) : result ? (
          <p role="alert" className="font-medium text-danger">We don’t deliver to {saved} yet. Try another pincode.</p>
        ) : (
          <p className="text-ink-3">Check delivery dates and cash-on-delivery for your area. Try 400050 or 560034.</p>
        )}
      </div>
    </section>
  );
}
