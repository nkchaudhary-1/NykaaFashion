"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { OrderRow } from "@/components/account/OrdersView";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { formatMobile } from "@/lib/format";
import { useStore } from "@/lib/store";
import { updateProfile, useAuth } from "@/stores/account";
import { wishlistStore } from "@/stores/commerce";
import { toast } from "@/stores/ui";

/** Profile: three counters (3 + 3 + 3 of the 9 content columns), the latest order, then the details form on a 3-column field grid. */
export function ProfileView() {
  const { user, orders, addresses } = useAuth();
  const wishlist = useStore(wishlistStore).length;
  const [draft, setDraft] = useState<{ name?: string; email?: string; gender?: string; dob?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (!user) return null;
  const v = { name: draft.name ?? user.name, email: draft.email ?? user.email, gender: draft.gender ?? user.gender ?? "", dob: draft.dob ?? user.dob ?? "" };
  const dirty = Object.keys(draft).length > 0;
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (v.name.trim().length < 2) err.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) err.email = "Enter a valid email address.";
    setErrors(err);
    if (Object.keys(err).length) return;
    updateProfile({ name: v.name.trim(), email: v.email.trim().toLowerCase(), gender: v.gender || undefined, dob: v.dob || undefined });
    setDraft({});
    toast({ title: "Profile updated" });
  };
  const stats = [
    { href: "/account/orders", n: orders.length, label: "Orders" },
    { href: "/account/addresses", n: addresses.length, label: "Saved addresses" },
    { href: "/wishlist", n: wishlist, label: "Saved pieces" },
  ];
  return (
    <div className="space-y-14 sm:space-y-16">
      <ul className="grid grid-cols-3 gap-[var(--gap)]">
        {stats.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="group flex h-full flex-col justify-between gap-6 border border-line bg-paper p-4 transition-colors hover:border-ink sm:p-6">
              <ArrowUpRight size={18} aria-hidden className="self-end text-ink-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
              <span>
                <span className="display-md block tabular-nums">{s.n}</span>
                <span className="mt-1 block text-[12.5px] leading-snug text-ink-2 sm:text-[13px]">{s.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {orders[0] && (
        <section aria-labelledby="lo">
          <div className="flex items-end justify-between gap-4">
            <h2 id="lo" className="display-sm">Latest order</h2>
            <Link href="/account/orders" className="link-u tap text-[12px] font-semibold uppercase tracking-[0.09em]">All orders</Link>
          </div>
          <ul className="mt-6 border-t border-ink">
            <OrderRow order={orders[0]} />
          </ul>
        </section>
      )}

      <section aria-labelledby="pf">
        <h2 id="pf" className="display-sm">Your details</h2>
        <form onSubmit={save} noValidate className="mt-8 grid grid-cols-1 gap-x-[var(--gap)] gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Full name" autoComplete="name" value={v.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} />
          <Input label="Email" type="email" autoComplete="email" value={v.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} error={errors.email} />
          <Input label="Mobile number" value={formatMobile(user.mobile)} readOnly disabled hint="Your sign-in. Not editable in this prototype." />
          <Select label="Gender" optional value={v.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option>Female</option><option>Male</option><option>Non-binary</option>
          </Select>
          <Input label="Date of birth" type="date" optional autoComplete="bday" value={v.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} />
          <div className="flex flex-wrap items-start gap-3 sm:col-span-2 lg:col-span-1">
            <Button type="submit" size="lg" disabled={!dirty}>Save changes</Button>
            {dirty && <Button variant="ghost" size="lg" onClick={() => (setDraft({}), setErrors({}))}>Discard</Button>}
          </div>
        </form>
      </section>
    </div>
  );
}
