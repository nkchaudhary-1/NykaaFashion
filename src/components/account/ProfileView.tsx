"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { formatMobile } from "@/lib/format";
import { useStore } from "@/lib/store";
import { updateProfile, useAuth } from "@/stores/account";
import { wishlistStore } from "@/stores/commerce";
import { toast } from "@/stores/ui";

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
  const stat = "border border-line bg-paper p-5";
  return (
    <div className="space-y-12">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <li className={stat}><Link href="/account/orders" className="block"><p className="display-md tabular-nums">{orders.length}</p><p className="mt-1 text-[13px] text-ink-2">Orders</p></Link></li>
        <li className={stat}><Link href="/account/addresses" className="block"><p className="display-md tabular-nums">{addresses.length}</p><p className="mt-1 text-[13px] text-ink-2">Saved addresses</p></Link></li>
        <li className={stat}><Link href="/wishlist" className="block"><p className="display-md tabular-nums">{wishlist}</p><p className="mt-1 text-[13px] text-ink-2">Saved pieces</p></Link></li>
      </ul>
      <section aria-labelledby="pf">
        <h2 id="pf" className="display-sm">Your details</h2>
        <form onSubmit={save} noValidate className="mt-8 grid grid-cols-1 max-w-2xl gap-5 sm:grid-cols-2">
          <Input label="Full name" autoComplete="name" value={v.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} />
          <Input label="Email" type="email" autoComplete="email" value={v.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} error={errors.email} />
          <Input label="Mobile number" value={formatMobile(user.mobile)} readOnly disabled hint="Your sign-in. Not editable in this prototype." />
          <Select label="Gender" optional value={v.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option>Female</option><option>Male</option><option>Non-binary</option>
          </Select>
          <Input label="Date of birth" type="date" optional autoComplete="bday" value={v.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} />
          <div className="flex items-end gap-3 sm:col-span-2">
            <Button type="submit" size="lg" disabled={!dirty}>Save changes</Button>
            {dirty && <Button variant="ghost" size="lg" onClick={() => (setDraft({}), setErrors({}))}>Discard</Button>}
          </div>
        </form>
      </section>
    </div>
  );
}
