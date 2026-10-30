"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Layers, ShoppingBag } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { CountBadge } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { bagStore, wishlistStore } from "@/stores/commerce";
import { setUI, useUI } from "@/stores/ui";

// On product pages the sticky add-to-bag bar owns the bottom edge; checkout is focused and distraction-free.
const HIDE_ON = [/^\/p\//, /^\/checkout/];

/**
 * Phones & tablets. Five fixed destinations, each one tap: Home · Shop (category sheet) · Edits · Wishlist · Bag.
 * Counts are badges, the current page is marked with a bar and aria-current. Account and search sit in the top bar.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { menuOpen } = useUI();
  const bagCount = useStore(bagStore).lines.reduce((n, l) => n + l.qty, 0);
  const wishCount = useStore(wishlistStore).length;
  const hidden = HIDE_ON.some((r) => r.test(pathname));
  useEffect(() => {
    document.documentElement.dataset.nonav = hidden ? "true" : "";
    return () => {
      document.documentElement.dataset.nonav = "";
    };
  }, [hidden]);
  if (hidden) return null;

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const cell = "relative flex h-full w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-wide transition-colors";
  const bar = <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 bg-ink" />;

  const link = (href: string, label: string, icon: ReactNode, count = 0) => (
    <li>
      <Link href={href} aria-current={active(href) ? "page" : undefined} className={cn(cell, active(href) ? "text-ink" : "text-ink-3")}>
        <span className="relative">
          {icon}
          {count > 0 && <CountBadge n={count} className="-right-2.5 -top-1.5" />}
        </span>
        {label}
        {count > 0 && <span className="sr-only">, {count} {count === 1 ? "item" : "items"}</span>}
        {active(href) && bar}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bone pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid h-[var(--bottom-nav-h)] grid-cols-5">
        {link("/", "Home", <Home size={22} strokeWidth={active("/") ? 1.9 : 1.4} aria-hidden />)}
        <li>
          <button type="button" onClick={() => setUI({ menuOpen: true })} aria-haspopup="dialog" aria-expanded={menuOpen} className={cn(cell, menuOpen ? "text-ink" : "text-ink-3")}>
            <LayoutGrid size={22} strokeWidth={menuOpen ? 1.9 : 1.4} aria-hidden />
            Shop
            {menuOpen && bar}
          </button>
        </li>
        {link("/edits", "Edits", <Layers size={22} strokeWidth={active("/edits") ? 1.9 : 1.4} aria-hidden />)}
        {link("/wishlist", "Wishlist", <Heart size={22} strokeWidth={active("/wishlist") ? 1.9 : 1.4} aria-hidden />, wishCount)}
        {link("/bag", "Bag", <ShoppingBag size={22} strokeWidth={active("/bag") ? 1.9 : 1.4} aria-hidden />, bagCount)}
      </ul>
    </nav>
  );
}
