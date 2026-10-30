"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, LayoutGrid, Layers, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { CountBadge } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { bagStore } from "@/stores/commerce";
import { setUI } from "@/stores/ui";

// On product pages the sticky add-to-bag bar owns the bottom edge; checkout is focused and distraction-free.
const HIDE_ON = [/^\/p\//, /^\/checkout/];

export function BottomNav() {
  const pathname = usePathname();
  const count = useStore(bagStore).lines.reduce((n, l) => n + l.qty, 0);
  const hidden = HIDE_ON.some((r) => r.test(pathname));
  useEffect(() => {
    document.documentElement.dataset.nonav = hidden ? "true" : "";
    return () => {
      document.documentElement.dataset.nonav = "";
    };
  }, [hidden]);
  if (hidden) return null;

  const cell = "relative flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-wide transition-colors";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/discover", label: "Discover", Icon: Compass },
    { href: "/edits", label: "Edits", Icon: Layers },
  ];
  return (
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bone/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="grid h-[var(--bottom-nav-h)] grid-cols-5">
        {items.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} aria-current={active(href) ? "page" : undefined} className={cn(cell, active(href) ? "text-ink" : "text-ink-3")}>
              <Icon size={22} strokeWidth={active(href) ? 1.9 : 1.4} aria-hidden />
              {label}
              {active(href) && <span aria-hidden className="absolute top-0 h-0.5 w-8 bg-ink" />}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => setUI({ menuOpen: true })} aria-haspopup="dialog" className={cn(cell, "w-full text-ink-3")}>
            <LayoutGrid size={22} strokeWidth={1.4} aria-hidden />
            Shop
          </button>
        </li>
        <li>
          <Link href="/bag" aria-current={active("/bag") ? "page" : undefined} className={cn(cell, active("/bag") ? "text-ink" : "text-ink-3")}>
            <span className="relative">
              <ShoppingBag size={22} strokeWidth={active("/bag") ? 1.9 : 1.4} aria-hidden />
              {count > 0 && <CountBadge n={count} className="-right-2.5 -top-1.5" />}
            </span>
            Bag{count > 0 && <span className="sr-only">, {count} items</span>}
            {active("/bag") && <span aria-hidden className="absolute top-0 h-0.5 w-8 bg-ink" />}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
