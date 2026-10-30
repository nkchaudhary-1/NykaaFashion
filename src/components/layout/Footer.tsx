"use client";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Col } from "@/components/layout/Grid";
import { FOOTER_LINKS } from "@/data/content";
import { setUI } from "@/stores/ui";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

/** Footer on the page grid: brand + newsletter (4 columns), four link columns (2 each), a legal row. Flat ink band. */
export function Footer() {
  return (
    <footer className="on-dark mt-[var(--section-y)] bg-ink text-bone">
      <div className="container-x pb-10 pt-16 sm:pt-20">
        <div className="grid-main gap-y-14">
          <Col span={{ base: 4, sm: 12, lg: 4 }}>
            <Logo onDark />
            <p className="mt-8 max-w-[16ch] text-[32px] font-medium leading-[1.05] tracking-[-0.035em]">
              Taste, <span className="font-light">not discount.</span>
            </p>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-bone/70">Hidden Gems, Luxe, the Responsible Edit and our own labels — edited, so you don’t have to scroll.</p>
            <NewsletterForm />
          </Col>
          <nav aria-label="Footer" className="col-span-4 grid grid-cols-2 gap-x-[var(--gap)] gap-y-10 sm:col-span-12 sm:grid-cols-4 lg:col-span-8 lg:col-start-5">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-5 text-bone/60">{col.title}</h2>
                <ul className="space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="link-u inline-block py-1.5 text-[14px] text-bone/90 hover:text-bone [@media(pointer:coarse)]:py-3">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-bone/20 pt-6 text-[12.5px] text-bone/65 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-[72ch]">A design prototype — not the real Nykaa Fashion. Products, labels and stories are fictional; House of Nykaa label names are used as named in the brief. Checkout, payments, orders and personalisation are simulated.</p>
          <button type="button" onClick={() => setUI({ protoOpen: true })} aria-haspopup="dialog" className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-bone/40 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-bone transition-colors hover:bg-bone hover:text-ink">
            <FlaskConical size={14} aria-hidden /> Prototype controls
          </button>
        </div>
      </div>
    </footer>
  );
}
