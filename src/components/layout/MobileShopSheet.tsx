"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Img, SIZES } from "@/components/ui/Img";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { categories, topCategories } from "@/data/categories";
import { deptNewIn, deptSale, type Dept } from "@/data/nav";
import { productsInCategory } from "@/data/queries";
import { setUI, useUI } from "@/stores/ui";

/** Bottom-nav "Shop": pick a department, then browse its categories as image tiles (2-up grid on the phone grid). */
export function MobileShopSheet() {
  const { menuOpen } = useUI();
  const [top, setTop] = useState(topCategories[0].id);
  const close = () => setUI({ menuOpen: false });
  const subs = categories.filter((c) => c.parent === top);
  const topName = topCategories.find((t) => t.id === top)?.name ?? "";
  const quick = [
    ["/edits/new-in", "New in"],
    ["/offers", "Offers"],
    ["/brands", "Labels A–Z"],
  ];
  return (
    <Overlay open={menuOpen} onClose={close} label="Shop" side="bottom" panelClassName="h-[88dvh]">
      <OverlayHeader title="Shop" />
      <div className="shrink-0 px-2">
        <Tabs items={topCategories.map((t) => ({ id: t.id, label: t.name }))} value={top} onChange={setTop} label="Departments" panelId="shop-panel" />
      </div>
      <OverlayBody>
        <div id="shop-panel" role="tabpanel" aria-label={topName}>
          <Link href={`/c/${top}`} onClick={close} className="flex min-h-12 items-center justify-between border-b border-ink pb-3 text-[17px] font-medium tracking-[-0.015em]">
            Shop all {topName.toLowerCase()} <ArrowRight size={18} aria-hidden />
          </Link>
          <ul className="mt-4 flex gap-2">
            {[["What’s New", deptNewIn(top as Dept)], ["Sale", deptSale(top as Dept)]].map(([label, href]) => (
              <li key={href}>
                <Link href={href} onClick={close} className="tap inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[13.5px] font-medium text-ink hover:border-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
            {subs.map((c) => {
              const rep = productsInCategory(c.id).find((p) => !p.soldOut) ?? productsInCategory(c.id)[0];
              return (
                <li key={c.id}>
                  <Link href={`/c/${c.id}`} onClick={close} className="block">
                    <div className="bg-sand">{rep && <Img imgKey={rep.variants[0].images[0]} alt="" sizes={SIZES.thumb} ratio="1/1" />}</div>
                    <p className="mt-2 text-[14px] font-medium leading-snug">{c.name}</p>
                    <p className="text-[12px] tabular-nums text-ink-3">{productsInCategory(c.id).length} products</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <ul className="mt-8 grid grid-cols-3 border-t border-line pt-4">
          {quick.map(([href, label]) => (
            <li key={href}>
              <Link href={href} onClick={close} className="flex min-h-11 items-center text-[13.5px] font-medium">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </OverlayBody>
    </Overlay>
  );
}
