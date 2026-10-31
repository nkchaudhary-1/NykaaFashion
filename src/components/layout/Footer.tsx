"use client";
import Link from "next/link";
import { Apple, FlaskConical, Play } from "lucide-react";
import type { ReactNode } from "react";
import { Col } from "@/components/layout/Grid";
import { FOOTER_DIRECTORY, FOOTER_STRIP, HELPLINE, SOCIAL } from "@/data/footer";
import type { NavLink } from "@/data/nav";
import { setUI, toast } from "@/stores/ui";
import { NewsletterForm } from "./NewsletterForm";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";

const head = "text-[13px] font-semibold uppercase tracking-[0.04em] text-ink";
const link = "inline-block py-1.5 text-[14px] text-ink-2 transition-colors hover:text-pink [@media(pointer:coarse)]:py-3";

function LinkList({ links }: { links: NavLink[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.href + l.label}>
          <Link href={l.href} className={link}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The prototype has no app: the badges say so instead of linking nowhere. */
function StoreBadge({ store, icon }: { store: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => toast({ title: "There is no app in this prototype", description: `The ${store} badge is shown for fidelity to the live footer only.` })}
      className="inline-flex h-11 items-center gap-2.5 rounded-[var(--radius-sm)] border border-white/40 px-4 text-left transition-colors hover:border-white"
    >
      {icon}
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">{store === "App Store" ? "Download on the" : "Get it on"}</span>
        <span className="block text-[15px] font-semibold">{store}</span>
      </span>
    </button>
  );
}

function SocialIcon({ name }: { name: (typeof SOCIAL)[number]["name"] }) {
  return name === "Instagram" ? (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.6V21h2.9z" />
    </svg>
  );
}

/** The closing frame: the supplied wordmark at the width of the page, NYKAA in the brand magenta over the black band. */
function Wordmark() {
  return (
    <div className="on-dark bg-luxe text-bone">
      <div className="container-x pb-6 pt-14 sm:pt-20">
        <Link href="/" aria-label="Nykaa Fashion home" className="block">
          <svg aria-hidden viewBox={LOGO_VIEWBOX} className="block h-auto w-full">
            {LOGO_PATHS.map((p) => (
              <path key={p.d.slice(0, 24)} d={p.d} className={p.tone === "brand" ? "fill-brand" : "fill-bone"} />
            ))}
          </svg>
        </Link>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-bone/20 pt-5 text-[12px] text-bone/70">
          <p>Nykaa Fashion — a redesign prototype</p>
          <p>Sample data only. Nothing is sold.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The Nykaa Fashion footer on the page grid: a black strip (app + helpline), a link strip, the six-column directory (Women · Men · Kids · Luxe ·
 * Top Brands · House of Nykaa — two grid columns each), then the newsletter and the prototype notice. Flat bands, no shadows.
 */
export function Footer() {
  return (
    <footer className="mt-[var(--section-y)] text-ink">
      <div className="bg-luxe text-white">
        <div className="container-x grid-main gap-y-8 py-10">
          <Col span={{ base: 4, sm: 6, lg: 6 }}>
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.04em]">Download our app</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <StoreBadge store="Google Play" icon={<Play size={20} aria-hidden fill="currentColor" />} />
              <StoreBadge store="App Store" icon={<Apple size={20} aria-hidden fill="currentColor" />} />
            </div>
          </Col>
          <Col span={{ base: 4, sm: 6, lg: 6 }}>
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.04em]">For any help, you may call us at</h2>
            <p className="mt-4 text-[17px] font-semibold">
              <a href={HELPLINE.tel} className="hover:text-white/75">
                {HELPLINE.number}
              </a>
            </p>
            <p className="mt-1 text-[13px] text-white/75">{HELPLINE.hours}</p>
          </Col>
        </div>
      </div>

      <div className="container-x grid-main gap-y-10 pb-4 pt-12">
        <Col span={{ base: 2, sm: 4, lg: 2 }}>
          <h2 className={head}>Who are we</h2>
          <div className="mt-4">
            <LinkList links={FOOTER_STRIP.who} />
          </div>
        </Col>
        <Col span={{ base: 4, sm: 8, lg: 4 }}>
          <h2 className={head}>Help</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-[var(--gap)]">
            <LinkList links={FOOTER_STRIP.help} />
            <LinkList links={FOOTER_STRIP.policies} />
          </div>
        </Col>
        <Col span={{ base: 2, sm: 6, lg: 2 }}>
          <h2 className={head}>Quicklinks</h2>
          <div className="mt-4">
            <LinkList links={FOOTER_STRIP.quick} />
          </div>
        </Col>
        <Col span={{ base: 2, sm: 6, lg: 2 }}>
          <h2 className={head}>Follow us</h2>
          <ul className="mt-4 flex gap-3">
            {SOCIAL.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Nykaa Fashion on ${s.name} (opens in a new tab)`} className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-ink text-white transition-colors hover:bg-pink [@media(pointer:coarse)]:size-11">
                  <SocialIcon name={s.name} />
                </a>
              </li>
            ))}
          </ul>
        </Col>
      </div>

      <nav aria-label="Browse Nykaa Fashion" className="container-x grid-main gap-y-10 border-t border-line py-12">
        {FOOTER_DIRECTORY.map((col) => (
          <Col key={col.title} span={{ base: 2, sm: 4, lg: 2 }}>
            <h2 className={head}>{col.title}</h2>
            <div className="mt-4">
              <LinkList links={col.links} />
            </div>
          </Col>
        ))}
      </nav>

      <div className="border-t border-line bg-sand">
        <div className="container-x grid-main items-start gap-y-8 py-10">
          <Col span={{ base: 4, sm: 12, lg: 5 }}>
            <NewsletterForm className="" />
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 7 }} className="flex flex-col gap-4 text-[12.5px] text-ink-3 lg:items-end lg:text-right">
            <p className="max-w-[72ch]">A design prototype of an improved Nykaa Fashion — not the real site. Product, label and story content is sample data; checkout, payments, orders and personalisation are simulated.</p>
            <button type="button" onClick={() => setUI({ protoOpen: true })} aria-haspopup="dialog" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border border-ink px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white">
              <FlaskConical size={14} aria-hidden /> Prototype controls
            </button>
          </Col>
        </div>
      </div>
      <Wordmark />
    </footer>
  );
}
