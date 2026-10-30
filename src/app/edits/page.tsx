import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditTile } from "@/components/editorial/EditTile";
import { Img, SIZES } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { THEMES, computedEdits, primaryEdits } from "@/data/edits";
import { editProducts } from "@/data/queries";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Edits", description: "Curated destinations: Hidden Gems, Luxe, the Responsible Edit, Festive & Wedding and House of Nykaa." };

export default function EditsIndex() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Edits" }]} eyebrow="Curation is the default" title={<>Five ways in. <em>No grid required.</em></>} intro="Edits are curated destinations with a narrative, a set of labels and a short list of things worth owning. They sit beside Shop in the navigation — because taste should be the first way to look, not the last." />
      <ul className="container-x space-y-6 pb-16 sm:space-y-0 sm:pb-24">
        {primaryEdits.map((e, i) => {
          const t = THEMES[e.theme];
          const flip = i % 2 === 1;
          return (
            <li key={e.id}>
              <Reveal>
                <Link href={`/edits/${e.id}`} className="group grid overflow-hidden md:min-h-[420px] md:grid-cols-2" style={{ background: t.bg, color: t.fg }}>
                  <div className={cn("flex flex-col justify-center gap-5 p-8 sm:p-14", flip && "md:order-2")}>
                    <p className="eyebrow opacity-75">{e.kicker}</p>
                    <h2 className="display-lg">{e.title}</h2>
                    <p className="max-w-[44ch] text-[15px] leading-relaxed opacity-85">{e.narrative}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em]">
                      Shop the edit <span className="tabular-nums opacity-70">{editProducts(e).length}</span>
                      <ArrowRight size={16} className="transition-transform duration-300 ease-editorial group-hover:translate-x-1.5" aria-hidden />
                    </p>
                  </div>
                  <div className="relative min-h-[300px] overflow-hidden">
                    <Img imgKey={`scenes/edit-${e.id}-wide`} alt="" sizes={SIZES.half} ratio="16/9" priority={i < 2} className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.04]" />
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
      <section aria-labelledby="computed" className="container-x pb-8">
        <p className="eyebrow mb-3 text-ink-3">Computed — never hand-tagged</p>
        <h2 id="computed" className="display-md">Shortcuts by price & date.</h2>
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {computedEdits.map((e) => (
            <li key={e.id}>
              <EditTile edit={e} source="edits-index" sizes="(min-width:1024px) 25vw, (min-width:600px) 50vw, 100vw" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
