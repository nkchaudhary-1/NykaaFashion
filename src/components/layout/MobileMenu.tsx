"use client";
import Link from "next/link";
import { ChevronRight, FlaskConical, LogOut, Package, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Disclosure } from "@/components/ui/Disclosure";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { categories, topCategories } from "@/data/categories";
import { primaryEdits } from "@/data/edits";
import { initials } from "@/lib/format";
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
        {ready && user ? (
          <div className="border border-ink p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden data-initials={initials(user.name)} className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-bone before:content-[attr(data-initials)]" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{user.name}</p>
                <p className="truncate text-[12.5px] text-ink-3">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <Link href="/account" onClick={close} className="inline-flex min-h-11 items-center gap-2 border border-line-strong px-3"><User size={15} /> Profile</Link>
              <Link href="/account/orders" onClick={close} className="inline-flex min-h-11 items-center gap-2 border border-line-strong px-3"><Package size={15} /> Orders</Link>
            </div>
          </div>
        ) : (
          <Link href="/login" onClick={close} className="flex min-h-12 items-center justify-between border border-ink px-4 text-[14px] font-semibold uppercase tracking-[0.08em]">
            Sign in or create account <ChevronRight size={16} aria-hidden />
          </Link>
        )}

        <p className={group}>Shop</p>
        {topCategories.map((top) => (
          <Disclosure key={top.id} title={<span className="text-[15px] font-medium">{top.name}</span>} headingLevel={3}>
            <ul className="-mt-1">
              <li><Link href={`/c/${top.id}`} onClick={close} className={`${row} font-medium`}>All {top.name.toLowerCase()} <ChevronRight size={16} aria-hidden /></Link></li>
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
