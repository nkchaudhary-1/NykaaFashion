"use client";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Col } from "@/components/layout/Grid";
import { FOOTER_LINKS } from "@/data/content";
import { setUI } from "@/stores/ui";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

/** Footer on the page grid: brand + newsletter (4 columns), four link columns (2 each), a legal row. Flat grey band. */
export function Footer() {
  return (
    <footer className="mt-[var(--section-y)] border-t border-line bg-sand text-ink">
      <div className="container-x pb-10 pt-14 sm:pt-16">
        <div className="grid-main gap-y-12">
          <Col span={{ base: 4, sm: 12, lg: 4 }}>
            <Logo />
            <p className="mt-6 max-w-[30ch] text-[20px] font-semibold leading-[1.2] tracking-[-0.02em]">
              Women, men, kids and home — all in one place.
            </p>
            <NewsletterForm />
          </Col>
          <nav aria-label="Footer" className="col-span-4 grid grid-cols-2 gap-x-[var(--gap)] gap-y-10 sm:col-span-12 sm:grid-cols-4 lg:col-span-8 lg:col-start-5">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-5 text-ink">{col.title}</h2>
                <ul className="space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="inline-block py-1.5 text-[14px] text-ink-2 transition-colors hover:text-pink [@media(pointer:coarse)]:py-3">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-line-strong pt-6 text-[12.5px] text-ink-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-[78ch]">A design prototype of an improved Nykaa Fashion — not the real site. Product, label and story content is sample data; checkout, payments, orders and personalisation are simulated.</p>
          <button type="button" onClick={() => setUI({ protoOpen: true })} aria-haspopup="dialog" className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-ink px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-white">
            <FlaskConical size={14} aria-hidden /> Prototype controls
          </button>
        </div>
      </div>
    </footer>
  );
}
