"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/Button";
import { isLaunched, launchAtMs, type BrandLaunch, type LaunchOffer } from "@/data/launches";
import { cn } from "@/lib/cn";
import { signal } from "@/stores/intent";
import { toast } from "@/stores/ui";
import { useLaunchTime } from "./clock";
import { NotifyButton } from "./Notify";
import { OFFER_KIND, offerFigure, offerStartMs, offerState, offerWhen, shopHref, shortDate, type OfferState } from "./time";

/*
 * EXCLUSIVE OFFERS — a dark band of typographic rows. Each offer is a huge figure ("20%", "₹500", "Free", "6 pm"), its kind and title in display type, its detail, when it runs
 * ("Members from Fri 13 Nov, 6 pm", "From Sat 14 Nov, 11 am · until Sat 21 Nov"), a state chip that follows the launch clock (Live now / Starts … / Ended) and a code that
 * copies on a click. Under the rows, one quiet line for each of the other brands' headline offers. The band is `luxe`; heading accents are marigold, because the raspberry
 * the display type uses elsewhere is 2.7:1 on near-black (see `--em-color` in globals.css).
 */
export function LaunchOffers({ launch, others }: { launch: BrandLaunch; others: BrandLaunch[] }) {
  const time = useLaunchTime();
  const live = isLaunched(launch, time);
  const shop = shopHref(launch, true);
  return (
    <Section tone="luxe" id="offers" aria-labelledby="offers-h" className="scroll-mt-24 [--em-color:var(--color-marigold)]">
      <div className="grid-main items-end gap-y-8">
        <div className="col-span-4 min-w-0 sm:col-span-12 lg:col-span-8">
          <Rise as="p" y={14} className="eyebrow mb-5 text-stone">
            {launch.brand.name} · {live ? "On now" : "Before anyone else"}
          </Rise>
          <RevealText as="h2" className="display-lg">
            <span id="offers-h">
              Exclusive <em>offers</em>
            </span>
          </RevealText>
        </div>
        <div className="col-span-4 flex min-w-0 flex-col gap-5 sm:col-span-12 lg:col-span-4 lg:items-end">
          <Rise delay={120} className="max-w-[40ch] text-[15px] leading-relaxed text-stone lg:text-right">
            Launch discounts, special offers and early access for the {launch.brand.name} debut — {live ? "on now, while they last." : "opening a night before the doors do."}
          </Rise>
          <Rise delay={200}>
            {live ? (
              <LinkButton href={shop.href} variant="inverse" size="lg" iconRight={<ArrowRight size={16} aria-hidden />}>
                {shop.label}
              </LinkButton>
            ) : (
              <NotifyButton launch={launch} variant="inverse" />
            )}
          </Rise>
        </div>
      </div>

      <ol className="mt-14 border-t border-bone/30 sm:mt-20">
        {launch.offers.map((o, i) => (
          <OfferRow key={o.id} launch={launch} offer={o} index={i} time={time} />
        ))}
      </ol>

      {others.length > 0 && (
        <div className="mt-16 sm:mt-24">
          <Rise as="p" className="eyebrow text-stone">
            Also launching
          </Rise>
          <ul className="mt-4 border-t border-bone/30">
            {others.map((l) => {
              const o = l.offers.find((x) => x.kind === "discount") ?? l.offers.find((x) => x.kind !== "early-access") ?? l.offers[0];
              if (!o) return null;
              return (
                <li key={l.id} className="border-b border-bone/30">
                  <Link href={`/new-and-next/${l.id}#offers`} className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4 text-[15px] sm:py-5">
                    <span className="w-full shrink-0 font-medium text-bone sm:w-52">{l.brand.name}</span>
                    <span className="min-w-0 flex-1 text-stone">
                      {o.title}
                      {o.code && <span className="ml-3 text-[12px] font-semibold tracking-[0.12em] text-bone">{o.code}</span>}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[13px] tabular-nums text-stone">
                      {isLaunched(l, time) ? "Live now" : `From ${shortDate(launchAtMs(l))}`}
                      <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Section>
  );
}

const CHIP: Record<OfferState, string> = {
  live: "bg-marigold text-ink",
  soon: "border border-bone/60 text-bone",
  ended: "border border-bone/30 text-stone",
};

function OfferRow({ launch, offer: o, index, time }: { launch: BrandLaunch; offer: LaunchOffer; index: number; time: number }) {
  const state = offerState(launch, o, time);
  const chip = state === "live" ? "Live now" : state === "ended" ? "Ended" : `Starts ${shortDate(offerStartMs(launch, o))}`;
  return (
    <Rise as="li" y={20} className="border-b border-bone/30">
      <div className="grid-main items-start gap-y-5 py-8 sm:py-10 lg:py-12">
        <div className="col-span-4 flex min-w-0 items-baseline gap-4 sm:col-span-5 lg:col-span-4">
          <span aria-hidden className="eyebrow w-6 shrink-0 tabular-nums text-stone">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden className={cn("display-xl min-w-0 tabular-nums leading-[0.85] transition-opacity duration-500", state === "ended" && "opacity-40")}>
            {offerFigure(launch, o)}
          </span>
        </div>
        <div className="col-span-4 min-w-0 sm:col-span-7 lg:col-span-5">
          <p className="eyebrow text-stone">{OFFER_KIND[o.kind]}</p>
          <h3 className="display-sm mt-3">{o.title}</h3>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-stone">{o.detail}</p>
        </div>
        <div className="col-span-4 flex min-w-0 flex-col items-start gap-3 sm:col-span-7 sm:col-start-6 lg:col-span-3 lg:col-start-auto lg:items-end lg:text-right">
          <span className={cn("inline-flex h-[26px] items-center whitespace-nowrap px-2.5 text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em] transition-colors duration-500", CHIP[state])}>{chip}</span>
          <p className="text-[13px] leading-snug text-stone">{offerWhen(launch, o)}</p>
          {o.code && <CodeButton code={o.code} disabled={state === "ended"} />}
        </div>
      </div>
    </Rise>
  );
}

/** Click a code to copy it — the same behaviour as the home page's coupon strip (the clipboard may be blocked; it still confirms, so the flow is testable). */
function CodeButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    signal("discount_interaction");
    toast({ title: `Code ${code} copied`, description: "Apply it in your bag — simulated coupon." });
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      aria-label={disabled ? `Code ${code} — offer ended` : `Copy code ${code}`}
      className={cn("tap inline-flex h-11 items-center gap-2.5 border border-bone px-4 text-[12px] font-semibold tracking-[0.12em] tabular-nums text-bone transition-colors duration-300 hover:bg-bone hover:text-ink disabled:border-bone/30 disabled:text-stone disabled:line-through disabled:hover:bg-transparent disabled:hover:text-stone")}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {code}
    </button>
  );
}
