"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, CreditCard, Heart, MapPin, Menu, Package, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { CountBadge, IconButton } from "@/components/ui/Button";
import { productBySlug } from "@/data/catalog";
import { DEPTS, DEPT_TABS, SEARCH_PLACEHOLDER, deptOfPath, type Dept } from "@/data/nav";
import { useOutsideClick } from "@/lib/a11y";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";
import { logout, useAuth } from "@/stores/account";
import { bagStore, wishlistStore } from "@/stores/commerce";
import { setUI, useUI } from "@/stores/ui";
import { Logo } from "./Logo";
import { MorePanel, TabDropdown } from "./MegaMenu";

interface MenuState {
  open: string | null;
  preview: Dept | null;
  path: string;
}

const tapsOnly = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The Nykaa Fashion header, on the page grid. Desktop: one main row — wordmark · Women Men Kids Home More · search · Fashion|Luxe · Account Wishlist Cart —
 * and under it the department row (What’s New, Sale, then categories; tabs with a dropdown open a "Shop All" list). Hovering Women / Men / Kids / Home
 * previews that department’s row; More opens the poster tiles. Phones and tablets: menu · wordmark · account, then a full-width search field; wishlist and
 * bag live in the bottom navigation. The whole header steps away on scroll down and returns on scroll up.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { searchOpen } = useUI();
  // Menu state is keyed to the pathname, so navigating closes it without an effect.
  const [state, setState] = useState<MenuState>({ open: null, preview: null, path: pathname });
  const cur = state.path === pathname ? state : { open: null, preview: null };
  const { open } = cur;
  const patch = useCallback((p: Partial<Pick<MenuState, "open" | "preview">>) => setState((s) => ({ ...(s.path === pathname ? s : { open: null, preview: null }), ...p, path: pathname })), [pathname]);
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFocusOpen = useRef(false); // Esc returns focus to the trigger without re-opening its panel
  const wishlistCount = useStore(wishlistStore).length;
  const bagCount = useStore(bagStore).lines.reduce((n, l) => n + l.qty, 0);

  const activeDept = deptOfPath(pathname, (slug) => productBySlug[slug]?.categoryPath[0]);
  const onDeptRoute = /^\/(c|p)\//.test(pathname);
  const shown = cur.preview ?? activeDept;
  const minimal = pathname === "/checkout"; // checkout keeps the main row only — fewer exits from the funnel
  const tabs = DEPT_TABS[shown];

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

  // --header-h is the header's real height (it changes with the breakpoint and on checkout), so sticky bars never sit under or away from it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const schedule = (fn: () => void, delay: number) => {
    cancel();
    timer.current = setTimeout(fn, delay);
  };
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    patch({ open: null });
  }, [patch]);

  const openBag = () => (window.matchMedia("(min-width: 1024px)").matches ? setUI({ bagOpen: true }) : router.push("/bag"));
  const isCurrent = (href: string) => pathname === href;
  /** On touch screens a first tap opens a dropdown instead of navigating; a second tap follows the link. */
  const tapOpens = (e: MouseEvent, id: string, hasPanel: boolean) => {
    if (hasPanel && tapsOnly() && open !== id) {
      e.preventDefault();
      patch({ open: id });
    }
  };
  const itemHandlers = (id: string | null) => ({
    onMouseEnter: () => schedule(() => patch({ open: id }), id ? 90 : 0),
    onFocus: () => {
      if (skipFocusOpen.current) skipFocusOpen.current = false;
      else patch({ open: id });
    },
    onBlur: (e: FocusEvent<HTMLLIElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) close();
    },
    onKeyDown: (e: KeyboardEvent<HTMLLIElement>) => {
      if (e.key !== "Escape" || !id || open !== id) return;
      e.stopPropagation();
      skipFocusOpen.current = true;
      close();
      e.currentTarget.querySelector("a")?.focus();
    },
  });

  const searchBtn = (width: string) =>
    cn("flex h-11 items-center gap-3 rounded-t-[var(--radius-sm)] border-b-2 bg-sand px-4 text-left text-[15px] text-ink-3 transition-colors hover:bg-paper", width, searchOpen ? "border-pink" : "border-line-strong");
  const searchLabel = <span className="truncate">{SEARCH_PLACEHOLDER}</span>;

  return (
    <header ref={headerRef} className={cn("sticky top-0 z-40 bg-white transition-transform duration-500 ease-editorial", hidden && !open && "-translate-y-full")} onMouseLeave={() => schedule(() => patch({ open: null, preview: null }), 180)}>
      {/* ── Phones & tablets ── */}
      <div className="lg:hidden">
        <div className="container-x flex h-[52px] items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <IconButton label="Open menu" onClick={() => setUI({ navOpen: true })} className="-ml-3">
              <Menu size={22} strokeWidth={1.5} />
            </IconButton>
            <Logo />
          </div>
          <AccountMenu compact />
        </div>
        <div className="container-x flex h-[52px] items-center border-b border-line pb-2">
          <button type="button" onClick={() => setUI({ searchOpen: true })} className={searchBtn("w-full")}>
            <Search size={19} aria-hidden className="shrink-0" />
            {searchLabel}
          </button>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block">
        <div className="relative">
          <div className="container-x flex h-16 items-center">
            <Logo className="shrink-0" />
            <nav aria-label="Primary" className="ml-10 self-stretch">
              <ul className="-ml-3 flex h-full items-center">
                {DEPTS.map((d) => {
                  const lit = cur.preview ? cur.preview === d.id : onDeptRoute && activeDept === d.id;
                  return (
                    <li key={d.id} className="h-full" onMouseEnter={() => schedule(() => patch({ preview: d.id, open: null }), 70)}>
                      <Link
                        href={`/c/${d.id}`}
                        aria-current={isCurrent(`/c/${d.id}`) ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-full items-center px-3 text-[16px] font-medium text-ink transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-pink after:transition-transform after:duration-300 after:ease-editorial",
                          lit ? "after:scale-x-100" : "after:scale-x-0 hover:text-pink",
                        )}
                      >
                        {d.label}
                      </Link>
                    </li>
                  );
                })}
                <li className="h-full" {...itemHandlers("more")}>
                  <Link
                    href="/edits"
                    aria-expanded={open === "more"}
                    aria-haspopup="true"
                    aria-controls={open === "more" ? "more-panel" : undefined}
                    onClick={(e) => tapOpens(e, "more", true)}
                    className={cn(
                      "relative inline-flex h-full items-center px-3 text-[16px] font-medium text-ink transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-pink after:transition-transform after:duration-300 after:ease-editorial",
                      open === "more" ? "after:scale-x-100" : "after:scale-x-0 hover:text-pink",
                    )}
                  >
                    More
                  </Link>
                  {/* The panel follows its trigger in the DOM (so Tab walks straight into it) but is positioned against the full-width row. */}
                  <AnimatePresence>
                    {open === "more" && (
                      <motion.div key="more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease }} onMouseEnter={cancel}>
                        <MorePanel id="more-panel" onNavigate={close} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-4" onMouseEnter={() => schedule(() => patch({ open: null }), 0)}>
              <button type="button" onClick={() => setUI({ searchOpen: true })} className={searchBtn("w-[clamp(220px,22vw,400px)]")}>
                <Search size={20} aria-hidden className="shrink-0" />
                {searchLabel}
              </button>
              <StoreToggle luxe={pathname.startsWith("/edits/luxe")} />
              <div className="flex items-center">
                <AccountMenu />
                <HeaderAction label={`Wishlist${wishlistCount ? `, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}` : ""}`} text="Wishlist" badge={wishlistCount} onClick={() => router.push("/wishlist")}>
                  <Heart size={22} strokeWidth={1.5} />
                </HeaderAction>
                <HeaderAction label={`Cart${bagCount ? `, ${bagCount} ${bagCount === 1 ? "item" : "items"}` : ""}`} text="Cart" badge={bagCount} onClick={openBag}>
                  <ShoppingBag size={22} strokeWidth={1.5} />
                </HeaderAction>
              </div>
            </div>
          </div>
        </div>

        {/* Department row — the live site's second line: What’s New, Sale, then the categories of the department being browsed or hovered. */}
        {!minimal && (
          <div className="border-b border-line">
            <div className="container-x">
              <nav aria-label={`${DEPTS.find((d) => d.id === shown)?.label} categories`}>
                <ul className="-ml-4 flex h-11 items-center">
                  {tabs.map((t, i) => {
                    const id = `tab-${shown}-${i}`;
                    const hasPanel = !!t.items?.length;
                    const here = !t.href.includes("?") && (pathname === t.href || pathname.startsWith(`${t.href}/`));
                    return (
                      <li key={id} className="relative" {...itemHandlers(hasPanel ? id : null)}>
                        <Link
                          href={t.href}
                          aria-current={here ? "page" : undefined}
                          aria-expanded={hasPanel ? open === id : undefined}
                          aria-haspopup={hasPanel ? "true" : undefined}
                          aria-controls={hasPanel && open === id ? `${id}-panel` : undefined}
                          onClick={(e) => tapOpens(e, id, hasPanel)}
                          className={cn("inline-flex h-11 items-center gap-1.5 px-4 text-[15px] font-medium transition-colors", open === id ? "bg-sand text-ink" : here ? "text-pink" : "text-ink hover:bg-sand")}
                        >
                          {t.label}
                          {hasPanel && <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-300", open === id && "rotate-180")} />}
                        </Link>
                        <AnimatePresence>
                          {hasPanel && open === id && (
                            <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14, ease }} onMouseEnter={cancel}>
                              <TabDropdown id={`${id}-panel`} tab={t} onNavigate={close} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/** Fashion | Luxe — the live site's store switch. "Luxe" opens the Luxe edit. */
function StoreToggle({ luxe }: { luxe: boolean }) {
  const seg = "flex h-11 w-16 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium leading-none transition-colors";
  return (
    <div role="group" aria-label="Store" className="hidden h-[52px] items-center rounded-full bg-stone p-1 xl:flex">
      <Link href="/" aria-current={luxe ? undefined : "true"} className={cn(seg, luxe ? "text-ink-2 hover:text-ink" : "bg-white text-ink")}>
        <span aria-hidden className="text-[17px] font-black italic leading-none">N</span>
        Fashion
      </Link>
      <Link href="/edits/luxe" aria-current={luxe ? "true" : undefined} className={cn(seg, luxe ? "bg-white text-ink" : "text-ink-2 hover:text-ink")}>
        <svg aria-hidden viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <circle cx="12" cy="6.6" r="4.6" />
          <circle cx="17.4" cy="12" r="4.6" />
          <circle cx="12" cy="17.4" r="4.6" />
          <circle cx="6.6" cy="12" r="4.6" />
        </svg>
        Luxe
      </Link>
    </div>
  );
}

const ACTION = "relative flex h-14 min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 text-ink transition-colors hover:bg-sand";

/** Header action: icon over its label (44px+ target, flat hover). The visible word is the start of the accessible name. */
function HeaderAction({ label, text, badge, onClick, children }: { label: string; text: string; badge?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={ACTION}>
      <span className="relative">
        {children}
        {badge ? <CountBadge n={badge} className="-right-2.5 -top-1.5" /> : null}
      </span>
      <span aria-hidden className="text-[14px] font-semibold">{text}</span>
    </button>
  );
}

/** Account: signed out → the member pitch + "Login/Signup Now"; signed in → "Hi {name}", Orders, Saved Payments, Logout (the live dropdowns). */
function AccountMenu({ compact }: { compact?: boolean }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useOutsideClick(ref, open, () => setOpen(false));
  const hover = (on: boolean) => {
    if (compact || tapsOnly()) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(on), on ? 80 : 180);
  };
  const first = user?.name.split(" ")[0];
  const row = "flex min-h-12 items-center justify-between gap-3 border-t border-line py-3 text-[16px] text-ink hover:text-pink";
  const avatar = user ? <span aria-hidden data-initials={initials(user.name)} className="inline-flex size-[26px] items-center justify-center rounded-full bg-ink text-[10px] font-semibold tracking-wide text-white before:content-[attr(data-initials)]" /> : null;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        setOpen(false);
        btn.current?.focus();
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? "account-panel" : undefined}
        aria-label={compact ? (user ? `Account menu for ${user.name}` : "Account") : "Account"}
        onClick={() => setOpen((o) => !o)}
        className={compact ? "-mr-3 inline-flex size-11 items-center justify-center hover:bg-sand" : ACTION}
      >
        {compact ? (
          (ready && avatar) || <User size={22} strokeWidth={1.5} aria-hidden />
        ) : (
          <>
            {(ready && avatar) || <User size={22} strokeWidth={1.5} aria-hidden />}
            <span aria-hidden className="text-[14px] font-semibold">Account</span>
          </>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div id="account-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="absolute right-0 top-full z-50 w-[300px] border border-line-strong bg-white p-6">
            {ready && user ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="block text-center text-[24px] leading-tight text-ink hover:text-pink">
                  Hi {first}
                </Link>
                <p className="mb-5 mt-1.5 text-center text-[14px] tracking-[0.14em] text-ink-3">{user.mobile}</p>
                <Link href="/account/orders" onClick={() => setOpen(false)} className={row}>
                  Orders <Package size={20} strokeWidth={1.5} aria-hidden />
                </Link>
                <Link href="/account/addresses" onClick={() => setOpen(false)} className={row}>
                  Addresses <MapPin size={20} strokeWidth={1.5} aria-hidden />
                </Link>
                <Link href="/account/payments" onClick={() => setOpen(false)} className={row}>
                  Saved Payments <CreditCard size={20} strokeWidth={1.5} aria-hidden />
                </Link>
                <button type="button" onClick={() => (logout(), setOpen(false), router.push("/"))} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-[15px] font-semibold text-ink hover:border-ink">
                  Logout
                </button>
              </>
            ) : (
              <>
                <p className="text-[15px] leading-relaxed text-ink-3">Becoming a Nykaa Fashion member comes with easy order tracking, rewards, offers and more.</p>
                <button type="button" onClick={() => (setOpen(false), setUI({ loginOpen: true }))} className="mb-5 mt-5 inline-flex items-center gap-1 text-[16px] font-semibold text-pink hover:text-pink-ink">
                  Login/Signup Now <ChevronRight size={18} aria-hidden />
                </button>
                <Link href="/account/orders" onClick={() => setOpen(false)} className={cn(row, "border-b")}>
                  Orders <Package size={20} strokeWidth={1.5} aria-hidden />
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CountBadge };
