"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { FlaskConical } from "lucide-react";
import { setPrefs, usePrefs } from "@/stores/ui";

export function AnnouncementBar() {
  const { announceDismissed } = usePrefs();
  if (announceDismissed) return null;
  return (
    <div className="relative bg-ink text-bone">
      <div className="container-x flex min-h-9 items-center justify-center gap-2 py-2 pr-10 text-center text-[12px] leading-snug sm:text-[12.5px]">
        <FlaskConical size={13} aria-hidden className="hidden shrink-0 text-gold sm:block" />
        <p>
          <span className="font-medium">Design prototype.</span> <span className="text-bone/75">Checkout, payments, orders and personalisation are simulated.</span>{" "}
          <Link href="/prototype" className="link-u whitespace-nowrap font-medium text-bone">
            How it works
          </Link>
        </p>
      </div>
      <button type="button" aria-label="Dismiss announcement" onClick={() => setPrefs({ announceDismissed: true })} className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center text-bone/70 hover:text-bone sm:right-3">
        <X size={15} />
      </button>
    </div>
  );
}
