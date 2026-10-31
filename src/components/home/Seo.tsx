"use client";
import { Col, Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { RevealText, Rise } from "@/components/motion/reveal";
import { Disclosure } from "@/components/ui/Disclosure";
import { SEO_BLOCKS, SERVICE_PROMISES } from "@/data/home-content";
import { pad2 } from "./kit";

// ── The long SEO copy of the live homepage, as a quiet two-column accordion between hairlines ──
export function SeoBlocks() {
  return (
    <Section tone="paper" y="md">
      <RevealText as="h2" className="display-md">
        More about <em>Nykaa Fashion</em>
      </RevealText>
      <div className="mt-10 grid gap-x-[var(--gap)] sm:mt-14 sm:grid-cols-2 lg:gap-x-[calc(var(--gap)*2)]">
        {[SEO_BLOCKS.slice(0, 3), SEO_BLOCKS.slice(3)].map((col, c) => (
          <div key={c} className="border-t border-ink">
            {col.map((b) => (
              <Disclosure key={b.title} title={<span className="text-[17px] font-medium tracking-[-0.01em]">{b.title}</span>} headingLevel={3}>
                <p className="max-w-[62ch] pb-2 text-[14px] leading-relaxed text-ink-2">{b.body}</p>
              </Disclosure>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** The three service promises under the page: a numeral, a line, one sentence — set between hairlines. */
export function Values() {
  return (
    <Section tone="bone" y="none" className="py-16 sm:py-24">
      <Grid as="ul" className="gap-y-12">
        {SERVICE_PROMISES.map(({ title, body }, i) => (
          <Col as="li" key={title} span={{ base: 4, sm: 4, lg: 4 }}>
            <Rise delay={i * 90} className="h-full border-t border-ink pt-5">
              <p aria-hidden className="eyebrow tabular-nums text-ink-3">
                {pad2(i + 1)}
              </p>
              <h2 className="display-sm mt-8">{title}</h2>
              <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-2">{body}</p>
            </Rise>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
