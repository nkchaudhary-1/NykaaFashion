import type { Metadata } from "next";
import Link from "next/link";
import { OpenPrototypeButton } from "@/components/layout/OpenPrototypeButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Prototype notes", description: "What is real, what is simulated, and how to review the adaptive home." };

const ROWS: Array<[string, string, string]> = [
  ["Intent-adaptive default surface", "Real-time behavioural adaptation", "Simulated — cold / returning / deal via localStorage heuristics"],
  ["All three user types", "Fully personalised per segment", "One adaptive surface; curation-first cold-start default"],
  ["Editorial + personalisation", "Editorial + ML personalisation", "Editorial (real content) + a personalised rail (simulated scoring)"],
  ["Surface", "Responsive web → iOS app", "Responsive web (desktop + mobile) now; iOS later"],
];

const JOURNEYS: Array<[string, string, string]> = [
  ["Browser, cold start", "/", "Curation leads. Open a story, an edit, then a piece."],
  ["Deal-seeker", "/?ref=sale", "A sale-link arrival (or tapping the Offer module) promotes the discount path for the session."],
  ["Returning shopper", "/", "View or save three pieces — a ‘Picked for you’ rail appears."],
  ["Occasion shopper", "/edits/festive", "Festive & Wedding edit with narrative, labels and filters."],
  ["Sold-out piece", "/p/satin-corset-top", "Notify-me plus similar pieces, never a dead button."],
  ["No results", "/search?q=zzzz", "Graceful no-results with popular edits."],
  ["Account with history", "/login", "Use the demo account to see orders, tracking and addresses."],
];

export default function PrototypePage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Prototype notes" }]} eyebrow="Read me first" title={<>What’s real, <em>what’s simulated.</em></>} intro="A curation-first redesign of Nykaa Fashion’s discovery experience, built from the product brief. It is a front-end prototype: every control does something real against mock data — and anything that would need a backend is clearly labelled." />
      <div className="container-x pb-24">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-24">
          <div className="space-y-16">
            <section aria-labelledby="thesis">
              <h2 id="thesis" className="display-sm">The thesis</h2>
              <div className="prose-nf mt-5">
                <p>Nykaa Fashion’s default way to discover is a discount-led category grid, while its real equity — Hidden Gems, Luxe, the Responsible edit, House of Nykaa and editorial — is buried. This redesign makes <strong>curation the default</strong>: Edits sit beside Shop and Discover in the primary navigation, the homepage leads with a point of view, and a discount is shown only where a price has genuinely moved.</p>
                <p>The research also shows discovery is not what customers complain about most — fulfilment is. This is a growth and differentiation bet, and its ceiling is set by delivery, returns and refunds, which this prototype deliberately does not fix.</p>
              </div>
            </section>

            <section aria-labelledby="stage">
              <h2 id="stage" className="display-sm">North Star vs this build</h2>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
                  <caption className="sr-only">North Star versus the v1 prototype</caption>
                  <thead><tr className="border-b border-ink text-[11px] uppercase tracking-[0.12em] text-ink-3"><th scope="col" className="py-3 pr-4 font-medium">Decision</th><th scope="col" className="py-3 pr-4 font-medium">North Star</th><th scope="col" className="py-3 font-medium">This prototype</th></tr></thead>
                  <tbody>{ROWS.map((r) => (<tr key={r[0]} className="border-b border-line align-top"><th scope="row" className="py-4 pr-4 font-medium">{r[0]}</th><td className="py-4 pr-4 text-ink-2">{r[1]}</td><td className="py-4 text-ink-2">{r[2]}</td></tr>))}</tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="sim">
              <h2 id="sim" className="display-sm">What’s simulated</h2>
              <ul className="prose-nf mt-5">
                <li><strong>Adaptive home &amp; personalised rail</strong> — localStorage weights from what you view, save and add; a heuristic, not machine learning. Labelled <Badge tone="amber">Simulated</Badge> wherever it appears.</li>
                <li><strong>Checkout, payment, OTP sign-in, orders &amp; tracking</strong> — all mock. No payment is taken; no order exists; the OTP is always 123456. Test cards and UPI IDs are shown at checkout, including ones that fail on purpose.</li>
                <li><strong>Reviews, delivery estimates, coupons, back-in-stock alerts</strong> — deterministic mock content and rules.</li>
                <li><strong>Imagery</strong> — art-directed images generated by a script (no photo host was reachable in the build sandbox). Every image is a file at <code>/public/img/…</code>; replace any file with a photograph of the same name and nothing else changes.</li>
                <li><strong>Catalogue</strong> — fictional labels and products. House of Nykaa label names are used as named in the brief.</li>
              </ul>
            </section>

            <section aria-labelledby="journeys">
              <h2 id="journeys" className="display-sm">Journeys to try</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {JOURNEYS.map(([name, href, note]) => (
                  <li key={name}><Link href={href} className="group flex items-baseline justify-between gap-6 py-4"><span><span className="block text-[15px] font-medium">{name}</span><span className="mt-0.5 block text-[13.5px] text-ink-3">{note}</span></span><span aria-hidden className="shrink-0 transition-transform group-hover:translate-x-1">→</span></Link></li>
                ))}
              </ul>
              <p className="mt-6 text-[14px] text-ink-2">End to end: Home → Edit → Listing → Product → pick a size → Bag → Checkout (address, payment) → Confirmation → Track the order.</p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <div className="border border-line bg-paper p-6">
              <h2 className="display-xs">Review the adaptive home</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink-2">
                <li>Open the prototype controls.</li>
                <li>Switch <em>Session intent</em> between Cold, Returning and Deal.</li>
                <li>Watch the homepage modules re-order.</li>
                <li>Or earn it: view three products, or tap the Offer module.</li>
              </ol>
              <div className="mt-6"><OpenPrototypeButton /></div>
              <p className="mt-5 text-[12.5px] text-ink-3">Also in the panel: slow network, forced errors, a hidden home module, the analytics event log, and a one-click reset.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
