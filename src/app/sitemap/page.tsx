import type { Metadata } from "next";
import Link from "next/link";
import { Col } from "@/components/layout/Grid";
import { ListingHeader } from "@/components/plp/ListingHeader";
import { Section } from "@/components/layout/Section";
import { categories, topCategories } from "@/data/categories";
import { INFO_PAGES } from "@/data/content";
import { edits } from "@/data/edits";
import { labels } from "@/data/labels";

export const metadata: Metadata = { title: "Sitemap", description: "Every department, edit, brand and help page in the Nykaa Fashion prototype." };

interface Group {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const GROUPS: Group[] = [
  ...topCategories.map((top) => ({
    title: top.name,
    links: [{ label: `All ${top.name.toLowerCase()}`, href: `/c/${top.id}` }, ...categories.filter((c) => c.parent === top.id).map((c) => ({ label: c.name, href: `/c/${c.id}` }))],
  })),
  {
    title: "Edits",
    links: [...edits.map((e) => ({ label: e.title, href: `/edits/${e.id}` })), { label: "Style Files", href: "/discover" }, { label: "Offers", href: "/offers" }, { label: "New & Next — brand launches", href: "/new-and-next" }],
  },
  {
    title: "Brands",
    links: [...labels.slice(0, 12).map((l) => ({ label: l.name, href: `/brands/${l.id}` })), { label: "All brands A–Z", href: "/brands" }],
  },
  {
    title: "Help & company",
    links: [{ label: "Help Center", href: "/help" }, ...Object.entries(INFO_PAGES).map(([slug, p]) => ({ label: p.title, href: `/info/${slug}` })), { label: "Prototype notes", href: "/prototype" }],
  },
  {
    title: "Your account",
    links: [
      { label: "Login / Sign up", href: "/login" },
      { label: "Orders", href: "/account/orders" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Bag", href: "/bag" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <>
      <ListingHeader crumbs={[{ name: "Home", href: "/" }, { name: "Sitemap" }]} title="Sitemap" intro="Every department, edit, brand and help page in this prototype, in one place." />
      <Section y="none" className="pb-[var(--section-y)]">
        <div className="grid-main gap-y-12 border-t border-line pt-10">
          {GROUPS.map((g) => (
            <Col key={g.title} span={{ base: 4, sm: 6, lg: 3 }} as="section" aria-labelledby={`sm-${g.title.replace(/\W+/g, "-")}`}>
              <h2 id={`sm-${g.title.replace(/\W+/g, "-")}`} className="eyebrow text-ink">
                {g.title}
              </h2>
              <ul className="mt-3">
                {g.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="inline-block py-1.5 text-[14px] text-ink-2 transition-colors duration-300 hover:text-ink [@media(pointer:coarse)]:py-3">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Col>
          ))}
        </div>
      </Section>
    </>
  );
}
