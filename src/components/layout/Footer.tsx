import Link from "next/link";
import { FOOTER_LINKS } from "@/data/content";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-24 bg-luxe text-bone sm:mt-32">
      <div className="container-x pb-10 pt-16 sm:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          <div>
            <Logo onDark />
            <p className="display-sm mt-8 max-w-[18ch] text-bone">
              Taste, <em className="text-gold">not</em> discount.
            </p>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-bone/65">Hidden Gems, Luxe, the Responsible Edit and our own labels — edited, so you don’t have to scroll.</p>
            <NewsletterForm />
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-5 text-bone/55">{col.title}</h2>
                <ul className="space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="link-u inline-block py-1.5 text-[14px] text-bone/85 hover:text-bone">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-bone/15 pt-6 text-[12.5px] text-bone/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            A design prototype — not the real Nykaa Fashion. Products, labels and stories are fictional; House of Nykaa label names are used as named in the brief.
          </p>
          <p className="shrink-0">Checkout, payments, orders &amp; personalisation are simulated.</p>
        </div>
      </div>
    </footer>
  );
}
