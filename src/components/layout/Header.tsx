"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Heart, LogOut, MapPin, Package, Search, ShoppingBag, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CountBadge, IconButton } from "@/components/ui/Button";
import { useOutsideClick } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";
import { logout, useAuth } from "@/stores/account";
import { bagStore, wishlistStore } from "@/stores/commerce";
import { setUI } from "@/stores/ui";
import { CategoryMega, EditsMega } from "./MegaMenu";
import { Logo } from "./Logo";

type Mega = "edits" | "women" | "men" | "kids" | "home";
const NAV: Array<{ id: string; label: string; href: string; mega?: Mega }> = [
  { id: "discover", label: "Discover", href: "/discover" },
  { id: "edits", label: "Edits", href: "/edits", mega: "edits" },
  { id: "women", label: "Women", href: "/c/women", mega: "women" },
  { id: "men", label: "Men", href: "/c/men", mega: "men" },
  { id: "kids", label: "Kids", href: "/c/kids", mega: "kids" },
  { id: "home", label: "Home", href: "/c/home", mega: "home" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // Menu state is keyed to the pathname, so navigating closes it without an effect.
  const [menu, setMenu] = useState<{ id: Mega | null; path: string }>({ id: null, path: pathname });
  const open = menu.path === pathname ? menu.id : null;
  const setOpen = useCallback((id: Mega | null) => setMenu({ id, path: pathname }), [pathname]);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wishlistCount = useStore(wishlistStore).length;
  const bagCount = useStore(bagStore).lines.reduce((n, l) => n + l.qty, 0);

  // Hide on scroll down, reveal on scroll up (PRD §7.2: motion signals state, never decoration).
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        if (Math.abs(y - last) > 6) {
          const hide = y > last && y > 140;
          setHidden(hide);
          // Sticky bars below the header follow it up/down.
          document.documentElement.style.setProperty("--header-offset", hide ? "0px" : "var(--header-h)");
        }
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(null);
  }, [setOpen]);
  const schedule = (m: Mega | null, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(m), delay);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === "/edits" && pathname.startsWith("/edits")));

  return (
    <header className={cn("sticky top-0 z-40 transition-transform duration-500 ease-editorial", hidden && !open && "-translate-y-full")} onMouseLeave={() => schedule(null, 140)}>
      <div className={cn("relative border-b bg-bone/95 backdrop-blur-md transition-[border-color,box-shadow] duration-300", scrolled || open ? "border-line" : "border-transparent")}>
        <div className="container-x flex h-[var(--header-h)] items-center gap-2 sm:gap-4 lg:gap-8">
          <Logo className="shrink-0" />

          <nav aria-label="Primary" className="ml-2 hidden lg:block" onKeyDown={(e) => e.key === "Escape" && close()}>
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.id} onMouseEnter={() => schedule(n.mega ?? null, n.mega ? 90 : 0)} onFocus={() => n.mega && setOpen(n.mega)} onBlur={(e) => !e.currentTarget.parentElement?.contains(e.relatedTarget as Node) && close()}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    aria-expanded={n.mega ? open === n.mega : undefined}
                    aria-haspopup={n.mega ? "true" : undefined}
                    className={cn("relative inline-flex h-11 items-center gap-1 px-3.5 text-[13.5px] font-medium tracking-[0.01em] transition-colors after:absolute after:inset-x-3.5 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100", isActive(n.href) ? "text-ink after:scale-x-100" : "text-ink-2 hover:text-ink", open === n.mega && "after:scale-x-100 text-ink")}
                  >
                    {n.label}
                    {n.mega && <ChevronDown size={13} aria-hidden className={cn("transition-transform duration-300", open === n.mega && "rotate-180")} />}
                  </Link>
                </li>
              ))}
              <li aria-hidden className="mx-2 h-4 w-px bg-line-strong" />
              <li onMouseEnter={() => schedule(null, 0)}>
                <Link href="/offers" aria-current={isActive("/offers") ? "page" : undefined} className={cn("inline-flex h-11 items-center px-3 text-[13.5px] font-medium transition-colors", isActive("/offers") ? "text-ink" : "text-ink-3 hover:text-ink")}>
                  Offers
                </Link>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex items-center sm:gap-1">
            <button
              type="button"
              onClick={() => setUI({ searchOpen: true })}
              className="hidden h-11 w-[clamp(220px,22vw,340px)] items-center gap-3 border border-line-strong bg-paper px-4 text-left text-[13.5px] text-ink-3 transition-colors hover:border-ink xl:flex"
            >
              <Search size={17} aria-hidden className="text-ink" />
              <span className="flex-1 truncate">Search labels, edits, styles</span>
              <kbd aria-hidden className="hidden rounded border border-line-strong px-1.5 py-0.5 font-sans text-[10.5px] text-ink-3 2xl:block">/</kbd>
            </button>
            <IconButton label="Search" onClick={() => setUI({ searchOpen: true })} className="xl:hidden">
              <Search size={21} strokeWidth={1.5} />
            </IconButton>
            <IconButton label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`} onClick={() => router.push("/wishlist")} badge={wishlistCount}>
              <Heart size={21} strokeWidth={1.5} />
            </IconButton>
            <AccountMenu />
            <IconButton
              label={`Bag${bagCount ? `, ${bagCount} items` : ""}`}
              badge={bagCount}
              onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? setUI({ bagOpen: true }) : router.push("/bag"))}
            >
              <ShoppingBag size={21} strokeWidth={1.5} />
            </IconButton>
          </div>
        </div>

        {/* Mega menu — full-bleed panel under the bar */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mega"
              id="mega-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-bone shadow-[0_30px_60px_-30px_rgba(22,18,15,0.25)] lg:block"
              onMouseEnter={() => timer.current && clearTimeout(timer.current)}
            >
              {open === "edits" ? <EditsMega onNavigate={close} /> : <CategoryMega top={open} onNavigate={close} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function AccountMenu() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, open, () => setOpen(false));
  if (!ready || !user) {
    return (
      <IconButton label="Sign in or create account" onClick={() => router.push("/login")}>
        <User size={21} strokeWidth={1.5} />
      </IconButton>
    );
  }
  const item = "flex min-h-11 items-center gap-3 px-4 text-[14px] text-ink hover:bg-sand";
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button type="button" aria-label={`Account menu for ${user.name}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-sand">
        <span aria-hidden data-initials={initials(user.name)} className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold tracking-wide text-bone before:content-[attr(data-initials)]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 border border-line bg-paper py-2 shadow-xl">
            <div className="border-b border-line px-4 pb-3 pt-1">
              <p className="truncate text-[14px] font-medium">{user.name}</p>
              <p className="truncate text-[12.5px] text-ink-3">{user.email}</p>
            </div>
            <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>
              <User size={16} /> Profile
            </Link>
            <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}>
              <Package size={16} /> Orders &amp; tracking
            </Link>
            <Link role="menuitem" href="/account/addresses" className={item} onClick={() => setOpen(false)}>
              <MapPin size={16} /> Addresses
            </Link>
            <Link role="menuitem" href="/wishlist" className={item} onClick={() => setOpen(false)}>
              <Heart size={16} /> Wishlist
            </Link>
            <button role="menuitem" type="button" className={cn(item, "w-full border-t border-line text-left")} onClick={() => (logout(), setOpen(false), router.push("/"))}>
              <LogOut size={16} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CountBadge };
