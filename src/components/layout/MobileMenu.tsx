"use client";
import Link from "next/link";
import { ChevronRight, CreditCard, FlaskConical, LogOut, MapPin, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Disclosure } from "@/components/ui/Disclosure";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { SessionChip } from "@/components/team/SessionChip";
import { categories, topCategories } from "@/data/categories";
import { primaryEdits } from "@/data/edits";
import { deptNewIn, deptSale, type Dept } from "@/data/nav";
import { logout, useAuth } from "@/stores/account";
import { setUI, useUI } from "@/stores/ui";
import { Logo } from "./Logo";

/** Phone/tablet navigation drawer (hamburger): account, the whole sitemap in one scroll, help. */
export function MobileMenu() {
  const { navOpen } = useUI();
  const { user, ready } = useAuth();
  const router = useRouter();
  const close = () => setUI({ navOpen: false });
  const row = "flex min-h-11 items-center justify-between py-2 text-[15px] text-ink";
  const group = "eyebrow mb-1 mt-7 text-ink-3";
  return (
    <Overlay open={navOpen} onClose={close} label="Menu" side="left" hideClose>
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
        <Logo />
        <button type="button" onClick={close} aria-label="Close menu" className="-mr-3 inline-flex size-11 items-center justify-center text-ink hover:bg-sand">
          <span aria-hidden className="text-[26px] font-light leading-none">×</span>
        </button>
      </div>
      <OverlayBody>
        <SessionChip variant="menu" onNavigate={close} />
        {ready && user ? (
          <div className="border-b border-line pb-5">
            <p className="text-[22px] leading-tight">Hi {user.name.split(" ")[0]}</p>
            <p className="mt-1 text-[13px] tracking-[0.12em] text-ink-3">{user.mobile}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
              <Link href="/account/orders" onClick={close} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-line-strong px-2"><Package size={15} aria-hidden /> Orders</Link>
              <Link href="/account/addresses" onClick={close} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-line-strong px-2"><MapPin size={15} aria-hidden /> Addresses</Link>
              <Link href="/account/payments" onClick={close} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-line-strong px-2"><CreditCard size={15} aria-hidden /> Payments</Link>
            </div>
          </div>
        ) : (
          <div className="border-b border-line pb-5">
            <p className="text-[14px] leading-relaxed text-ink-3">Becoming a Nykaa Fashion member comes with easy order tracking, rewards, offers and more.</p>
            <button type="button" onClick={() => (close(), setUI({ loginOpen: true }))} className="mt-3 inline-flex min-h-11 items-center gap-1 text-[16px] font-semibold text-pink">
              Login/Signup Now <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        )}

        <Link href="/new-and-next" onClick={close} className={`${row} mt-2 border-b border-line text-[17px] font-medium`}>
          <span className="inline-flex items-center gap-2">New &amp; Next <span aria-hidden className="size-1.5 rounded-full bg-pink" /></span>
          <ChevronRight size={16} aria-hidden className="text-ink-3" />
        </Link>

        <p className={group}>Shop</p>
        {topCategories.map((top) => (
          <Disclosure key={top.id} title={<span className="text-[15px] font-medium">{top.name}</span>} headingLevel={3}>
            <ul className="-mt-1">
              <li><Link href={`/c/${top.id}`} onClick={close} className={`${row} font-medium`}>All {top.name.toLowerCase()} <ChevronRight size={16} aria-hidden /></Link></li>
              <li><Link href={deptNewIn(top.id as Dept)} onClick={close} className={`${row} text-ink-2`}>What’s New <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link></li>
              <li><Link href={deptSale(top.id as Dept)} onClick={close} className={`${row} text-ink-2`}>Sale <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link></li>
              {categories.filter((c) => c.parent === top.id).map((c) => (
                <li key={c.id}><Link href={`/c/${c.id}`} onClick={close} className={`${row} text-ink-2`}>{c.name} <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link></li>
              ))}
            </ul>
          </Disclosure>
        ))}
        <Link href="/brands" onClick={close} className={`${row} border-b border-line font-medium`}>Brands <ChevronRight size={16} aria-hidden /></Link>
        <Link href="/offers" onClick={close} className={`${row} border-b border-line font-semibold text-pink`}>Offers <ChevronRight size={16} aria-hidden /></Link>

        <p className={group}>More</p>
        <Disclosure title={<span className="text-[15px] font-medium">Luxe, Hidden Gems &amp; more</span>} headingLevel={3}>
          <ul className="-mt-1">
            {primaryEdits.map((e) => (
              <li key={e.id}><Link href={`/edits/${e.id}`} onClick={close} className={`${row} text-ink-2`}>{e.title} <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link></li>
            ))}
            <li><Link href="/edits/new-in" onClick={close} className={`${row} text-ink-2`}>New in <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link></li>
            <li><Link href="/edits" onClick={close} className={`${row} font-medium`}>All curated edits <ChevronRight size={16} aria-hidden /></Link></li>
          </ul>
        </Disclosure>
        <Link href="/discover" onClick={close} className={`${row} border-b border-line`}>Style Files <ChevronRight size={16} aria-hidden className="text-ink-3" /></Link>

        <p className={group}>Help</p>
        <ul>
          {[
            ["/help", "Help centre"],
            ["/info/shipping", "Shipping & delivery"],
            ["/info/returns", "Returns & refunds"],
            ["/account/orders", "Track an order"],
          ].map(([href, label]) => (
            <li key={href}><Link href={href} onClick={close} className={`${row} text-ink-2`}>{label}</Link></li>
          ))}
          <li>
            <button type="button" onClick={() => (close(), setUI({ protoOpen: true }))} className={`${row} w-full text-left text-ink-2`}>
              <span className="inline-flex items-center gap-2"><FlaskConical size={15} aria-hidden /> Prototype controls</span>
            </button>
          </li>
          {ready && user && (
            <li>
              <button type="button" onClick={() => (logout(), close(), router.push("/"))} className={`${row} w-full text-left text-ink-2`}>
                <span className="inline-flex items-center gap-2"><LogOut size={15} aria-hidden /> Sign out</span>
              </button>
            </li>
          )}
        </ul>
      </OverlayBody>
    </Overlay>
  );
}
