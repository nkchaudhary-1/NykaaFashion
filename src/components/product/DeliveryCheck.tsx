"use client";
import Link from "next/link";
import { PackageCheck, PackageX, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { COD_FEE, FREE_SHIPPING_THRESHOLD, lookupPincode } from "@/data/commerce";
import { DAY, useNow } from "@/lib/clock";
import { fmtDate, inr } from "@/lib/format";
import { createStore, useStore } from "@/lib/store";

export const pinStore = createStore<string>("nf.pin", "");

/**
 * "Select Delivery Location" (simulated serviceability + estimate, PRD §5.5 "pattern-only"): a pincode field with Apply, the answer
 * underneath, then the three service promises — COD, returns, delivery date — each with a Know More link.
 */
export function DeliveryCheck({ price }: { price: number }) {
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

  // before a pincode is applied the delivery promise is a typical four-day estimate
  const days = result?.ok ? result.area.days : 4;
  const by = fmtDate(now + days * DAY, { weekday: "short", day: "numeric", month: "short" });
  const cod = result?.ok ? result.area.cod : true;
  const free = price >= FREE_SHIPPING_THRESHOLD;

  return (
    <section aria-labelledby="deliv">
      <h2 id="deliv" className="text-[19px] font-medium leading-tight tracking-[-0.02em]">
        Select Delivery Location
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-snug text-ink-2">Enter the pincode of your area to check product availability and delivery options</p>
      <form onSubmit={submit} noValidate className="relative mt-4">
        <input
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          aria-label="Delivery pincode"
          aria-invalid={formatError || undefined}
          aria-describedby="pin-msg"
          placeholder="Enter Pincode"
          value={value}
          onChange={(e) => (setDraft(e.target.value.replace(/\D/g, "")), setTouched(false))}
          className="h-12 w-full border border-line-strong bg-transparent pl-4 pr-20 text-[14.5px] tabular-nums placeholder:text-ink-3 transition-colors duration-300 hover:border-ink focus:border-ink"
        />
        <button type="submit" className="tap absolute inset-y-0 right-0 px-4 text-[13px] font-medium text-pink transition-colors hover:text-pink-ink">
          Apply
        </button>
      </form>
      <div id="pin-msg" aria-live="polite" className="mt-2.5 min-h-5 text-[12.5px] leading-snug">
        {formatError ? (
          <p role="alert" className="font-medium text-danger">Enter a valid 6-digit pincode.</p>
        ) : result?.ok ? (
          <div className="space-y-1">
            <p>
              Delivery by <strong className="font-semibold">{by}</strong> to {result.area.city === "Your area" ? saved : `${result.area.city}, ${saved}`}
            </p>
            <p className="text-ink-3">
              Free above {inr(FREE_SHIPPING_THRESHOLD)} · {result.area.cod ? `Cash on delivery available (${inr(COD_FEE)} fee)` : "Cash on delivery not available here"}
            </p>
          </div>
        ) : result ? (
          <p role="alert" className="font-medium text-danger">We don’t deliver to {saved} yet. Try another pincode.</p>
        ) : null}
      </div>

      <ul aria-label="Delivery and returns" className="mt-4 grid grid-cols-3 gap-3">
        <Service topic="cash on delivery" icon={cod ? <PackageCheck size={26} strokeWidth={1.4} aria-hidden /> : <PackageX size={26} strokeWidth={1.4} aria-hidden />} href="/info/shipping">
          {cod ? (
            <>COD <b className="font-semibold text-ink">available</b></>
          ) : (
            <>COD <b className="font-semibold text-ink">not available</b></>
          )}
        </Service>
        <Service topic="returns and size exchange" icon={<PackageCheck size={26} strokeWidth={1.4} aria-hidden />} href="/info/returns">
          7-day return &amp; size exchange
        </Service>
        <Service topic="delivery" icon={<Truck size={26} strokeWidth={1.4} aria-hidden />} href="/info/shipping">
          <b className="font-semibold text-ink">{free ? "Free Delivery" : "Delivery"}</b> by <b className="font-semibold text-ink">{by}</b>
        </Service>
      </ul>
      <p className="mt-3 text-[11.5px] leading-snug text-ink-3">Delivery dates, COD and returns are simulated in this prototype.</p>
    </section>
  );
}

function Service({ icon, href, topic, children }: { icon: ReactNode; href: string; topic: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col items-start gap-2 text-[12.5px] leading-snug text-ink-2">
      <span className="text-ink">{icon}</span>
      <span>{children}</span>
      <Link href={href} className="link-u tap mt-auto font-semibold text-pink hover:text-pink-ink">
        Know More<span className="sr-only"> about {topic}</span>
      </Link>
    </li>
  );
}
