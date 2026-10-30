"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Heart, LogOut, MapPin, Menu, Package, Search, ShoppingBag, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Col } from "@/components/layout/Grid";
import { CountBadge, IconButton } from "@/components/ui/Button";
import { useOutsideClick } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";
import { logout, useAuth } from "@/stores/account";
import { bagStore, wishlistStore } from "@/stores/commerce";
import { setUI } from "@/stores/ui";
import { CategoryMega, MoreMega } from "./MegaMenu";
import { Logo } from "./Logo";

type Mega = "more" | "women" | "men" | "kids" | "home";
const NAV: Array<{ id: string; label: string; href: string; mega?: Mega }> = [
  { id: "women", label: "Women", href: "/c/women", mega: "women" },
  { id: "men", label: "Men", href: "/c/men", mega: "men" },
  { id: "kids", label: "Kids", href: "/c/kids", mega: "kids" },
  { id: "home", label: "Home", href: "/c/home", mega: "home" },
  { id: "brands", label: "Brands", href: "/brands" },
  { id: "more", label: "More", href: "/edits", mega: "more" },
];

/**
 * Two tiers, aligned to the page grid. Desktop: row 1 = logo (3 cols) · search (6) · account / wishlist / bag (3);
 * row 2 = primary navigation (Women · Men · Kids · Home · Brands · More) with grid-aligned mega menus. Phones/tablets: menu · logo · account, then a full-width search
 * field — wishlist and bag live in the bottom navigation. The whole header steps away on scroll down and returns on scroll up.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // Menu state is keyed to the pathname, so navigating closes it without an effect.
  const [menu, setMenu] = useState<{ id: Mega | null; path: string }>({ id: null, path: pathname });
  const open = menu.path === pathname ? menu.id : null;
  const setOpen = useCallback((id: Mega | null) => setMenu({ id, path: pathname }), [pathname]);
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFocusOpen = useRef(false); // Esc returns focus to the trigger without re-opening its panel
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
        if (Math.abs(y - last) > 6) {
          const hide = y > last && y > 160;
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const openBag = () => (window.matchMedia("(min-width: 1024px)").matches ? setUI({ bagOpen: true }) : router.push("/bag"));

  const searchBtn = "flex h-11 w-full items-center gap-3 border border-ink bg-white px-4 text-left text-[14px] text-ink-3 transition-colors hover:bg-paper";

  return (
    <header className={cn("sticky top-0 z-40 bg-bone transition-transform duration-500 ease-editorial", hidden && !open && "-translate-y-full")} onMouseLeave={() => schedule(null, 140)}>
      {/* ── Phones & tablets ── */}
      <div className="lg:hidden">
        <div className="container-x flex h-[52px] items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <IconButton label="Open menu" onClick={() => setUI({ navOpen: true })} className="-ml-3">
              <Menu size={22} strokeWidth={1.5} />
            </IconButton>
            <Logo />
          </div>
          <AccountAction compact />
        </div>
        <div className="container-x flex h-[52px] items-center border-b border-line pb-2">
          <button type="button" onClick={() => setUI({ searchOpen: true })} className={searchBtn}>
            <Search size={18} aria-hidden className="shrink-0 text-ink" />
            <span className="truncate">Search labels, edits, styles</span>
          </button>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block">
        <div className="border-b border-line">
          <div className="container-x grid-main h-[68px] items-center">
            <Col span={{ lg: 3 }}>
              <Logo />
            </Col>
            <Col span={{ lg: 6 }}>
              <button type="button" onClick={() => setUI({ searchOpen: true })} className={searchBtn}>
                <Search size={18} aria-hidden className="shrink-0 text-ink" />
                <span className="flex-1 truncate">Search labels, edits, styles</span>
                <kbd aria-hidden className="border border-line-strong px-1.5 py-0.5 text-[10.5px] text-ink-3">/</kbd>
              </button>
            </Col>
            <Col span={{ lg: 3 }} className="flex items-center justify-end">
              <AccountAction />
              <Action label={`Wishlist${wishlistCount ? `, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` : ""}`} text="Wishlist" badge={wishlistCount} onClick={() => router.push("/wishlist")}>
                <Heart size={21} strokeWidth={1.5} />
              </Action>
              <Action label={`Bag${bagCount ? `, ${bagCount} ${bagCount === 1 ? "item" : "items"}` : ""}`} text="Bag" badge={bagCount} onClick={openBag}>
                <ShoppingBag size={21} strokeWidth={1.5} />
              </Action>
            </Col>
          </div>
        </div>

        <div className="relative border-b border-line">
          <div className="container-x flex h-11 items-center justify-between">
            <nav aria-label="Primary">
              <ul className="-ml-3.5 flex items-center">
                {NAV.map((n) => (
                  <li
                    key={n.id}
                    onMouseEnter={() => schedule(n.mega ?? null, n.mega ? 90 : 0)}
                    onFocus={() => {
                      if (skipFocusOpen.current) skipFocusOpen.current = false;
                      else if (n.mega) setOpen(n.mega);
                      else close();
                    }}
                    onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && close()}
                    onKeyDown={(e) => {
                      if (e.key !== "Escape" || open !== n.mega) return;
                      e.stopPropagation();
                      skipFocusOpen.current = true;
                      close();
                      e.currentTarget.querySelector("a")?.focus();
                    }}
                  >
                    <Link
                      href={n.href}
                      aria-current={isActive(n.href) ? "page" : undefined}
                      aria-expanded={n.mega ? open === n.mega : undefined}
                      aria-haspopup={n.mega ? "true" : undefined}
                      aria-controls={n.mega && open === n.mega ? "mega-panel" : undefined}
                      className={cn(
                        "relative inline-flex h-11 items-center gap-1 px-3.5 text-[13.5px] font-medium tracking-[0.005em] transition-colors after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:bg-ink after:transition-transform after:duration-300 after:ease-editorial",
                        isActive(n.href) || open === n.mega ? "text-ink after:scale-x-100" : "text-ink-2 after:scale-x-0 hover:text-ink",
                      )}
                    >
                      {n.label}
                      {n.mega && <ChevronDown size={13} aria-hidden className={cn("transition-transform duration-300", open === n.mega && "rotate-180")} />}
                    </Link>
                    {/* The panel follows its trigger in the DOM (so Tab walks straight into it) but is positioned against the full-width row. */}
                    <AnimatePresence>
                      {n.mega && open === n.mega && (
                        <motion.div
                          key="mega"
                          id="mega-panel"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-x-0 top-full border-b border-ink bg-bone"
                          onMouseEnter={() => timer.current && clearTimeout(timer.current)}
                        >
                          {n.mega === "more" ? <MoreMega onNavigate={close} /> : <CategoryMega top={n.mega} onNavigate={close} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            </nav>
            <ul className="flex items-center gap-1" onMouseEnter={() => schedule(null, 0)}>
              <li>
                <Link href="/offers" aria-current={isActive("/offers") ? "page" : undefined} className={cn("inline-flex h-11 items-center px-3.5 text-[13.5px] font-semibold transition-colors", isActive("/offers") ? "text-pink-ink" : "text-pink hover:text-pink-ink")}>
                  Offers
                </Link>
              </li>
              <li>
                <Link href="/edits/luxe" className="inline-flex h-8 items-center gap-2 bg-luxe px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ink-2">
                  Switch to <span className="text-gold">Luxe</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </header>
  );
}

/** Desktop header action: icon over a small label (44px+ target, flat hover). */
function Action({ label, text, badge, onClick, children }: { label: string; text: string; badge?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="relative flex h-14 min-w-[60px] flex-col items-center justify-center gap-1 px-2 text-ink transition-colors hover:bg-sand">
      <span className="relative">
        {children}
        {badge ? <CountBadge n={badge} className="-right-2.5 -top-1.5" /> : null}
      </span>
      <span aria-hidden className="text-[11px] font-medium">{text}</span>
    </button>
  );
}

function AccountAction({ compact }: { compact?: boolean }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, open, () => setOpen(false));

  if (!ready || !user) {
    return compact ? (
      <IconButton label="Sign in or create account" onClick={() => router.push("/login")} className="-mr-3">
        <User size={22} strokeWidth={1.5} />
      </IconButton>
    ) : (
      <Action label="Sign in or create account" text="Sign in" onClick={() => router.push("/login")}>
        <User size={21} strokeWidth={1.5} />
      </Action>
    );
  }
  const item = "flex min-h-11 items-center gap-3 px-4 text-[14px] text-ink hover:bg-sand";
  const avatar = <span aria-hidden data-initials={initials(user.name)} className="inline-flex size-[26px] items-center justify-center rounded-full bg-ink text-[10px] font-semibold tracking-wide text-bone before:content-[attr(data-initials)]" />;
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {compact ? (
        <button type="button" aria-label={`Account menu for ${user.name}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="-mr-3 inline-flex size-11 items-center justify-center hover:bg-sand">
          {avatar}
        </button>
      ) : (
        <button type="button" aria-label={`Account menu for ${user.name}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="flex h-14 min-w-[60px] flex-col items-center justify-center gap-1 px-2 text-ink transition-colors hover:bg-sand">
          {avatar}
          <span aria-hidden className="max-w-[72px] truncate text-[11px] font-medium">{user.name.split(" ")[0]}</span>
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="absolute right-0 top-full z-50 w-60 border border-ink bg-paper py-2">
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
