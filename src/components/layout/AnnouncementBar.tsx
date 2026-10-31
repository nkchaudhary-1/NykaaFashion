"use client";
import Link from "next/link";
import { CircleHelp, FlaskConical, X } from "lucide-react";
import { SessionChip } from "@/components/team/SessionChip";
import { setPrefs, usePrefs } from "@/stores/ui";

/** The thin black strip above the header (the live site carries "App Download" and "Help" here). It also holds the prototype notice, which can be dismissed. */
export function AnnouncementBar() {
  const { announceDismissed } = usePrefs();
  return (
    <div className="on-dark bg-luxe text-white">
      <div className="container-x flex min-h-9 items-center justify-between gap-4 text-[12px] leading-snug sm:text-[12.5px]">
        {announceDismissed ? (
          <span />
        ) : (
          <section aria-label="Prototype notice" className="flex min-w-0 items-center gap-2 py-1.5">
            <FlaskConical size={13} aria-hidden className="hidden shrink-0 text-gold sm:block" />
            <p className="min-w-0">
              <span className="font-semibold">Design prototype.</span> <span className="text-white/75">Checkout, payments, orders and personalisation are simulated.</span>{" "}
              <Link href="/prototype" className="link-u whitespace-nowrap font-medium text-white">
                How it works
              </Link>
            </p>
            <button type="button" aria-label="Dismiss announcement" onClick={() => setPrefs({ announceDismissed: true })} className="-my-2 inline-flex size-11 shrink-0 items-center justify-center text-white/70 hover:text-white">
              <X size={15} />
            </button>
          </section>
        )}
        <nav aria-label="Utility" className="hidden shrink-0 items-center gap-6 lg:flex">
          <SessionChip variant="bar" />
          <Link href="/account/orders" className="hover:text-white/75">
            Track order
          </Link>
          <Link href="/help" className="inline-flex items-center gap-1.5 hover:text-white/75">
            <CircleHelp size={14} aria-hidden /> Help
          </Link>
        </nav>
      </div>
    </div>
  );
}
