"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Disclosure } from "@/components/ui/Disclosure";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { categories, topCategories } from "@/data/categories";
import { setUI, useUI } from "@/stores/ui";

export function MobileShopSheet() {
  const { menuOpen } = useUI();
  const close = () => setUI({ menuOpen: false });
  const row = "flex min-h-11 items-center justify-between py-2 text-[15px] text-ink";
  return (
    <Overlay open={menuOpen} onClose={close} label="Shop" side="bottom" panelClassName="h-[88dvh]">
      <OverlayHeader title="Shop" />
      <OverlayBody>
        {topCategories.map((top) => (
          <Disclosure key={top.id} title={<span className="display-xs">{top.name}</span>} headingLevel={3}>
            <ul className="-mt-1">
              <li>
                <Link href={`/c/${top.id}`} onClick={close} className={`${row} font-medium`}>
                  All {top.name.toLowerCase()} <ChevronRight size={16} aria-hidden />
                </Link>
              </li>
              {categories.filter((c) => c.parent === top.id).map((c) => (
                <li key={c.id}>
                  <Link href={`/c/${c.id}`} onClick={close} className={`${row} text-ink-2`}>
                    {c.name} <ChevronRight size={16} aria-hidden className="text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
        <ul className="mt-6 grid grid-cols-1 gap-1 border-t border-line pt-4">
          {[
            ["/edits/new-in", "New in"],
            ["/brands", "All labels A–Z"],
            ["/offers", "Offers"],
            ["/wishlist", "Wishlist"],
            ["/account", "Account"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} onClick={close} className={row}>
                {label} <ChevronRight size={16} aria-hidden className="text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      </OverlayBody>
    </Overlay>
  );
}
