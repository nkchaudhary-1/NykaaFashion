"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select } from "@/components/ui/Form";
import { INDIAN_STATES, lookupPincode } from "@/data/commerce";
import { cn } from "@/lib/cn";
import { saveAddress, type Address } from "@/stores/account";

type Draft = Omit<Address, "id" | "isDefault"> & { isDefault: boolean };

const blank = (name = "", mobile = ""): Draft => ({ name, mobile, line1: "", line2: "", landmark: "", pincode: "", city: "", state: "", type: "home", isDefault: false });

/** Add / edit address with live pincode lookup (simulated) and per-field validation. Rows are 2 or 3 equal columns; the type picker is a row of flat square chips. */
export function AddressForm({ initial, defaults, onSaved, onCancel }: { initial?: Address; defaults?: { name?: string; mobile?: string }; onSaved: (a: Address) => void; onCancel?: () => void }) {
  const [d, setD] = useState<Draft>(initial ? { ...initial } : blank(defaults?.name, defaults?.mobile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const onPin = (raw: string) => {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    setD((p) => {
      const next = { ...p, pincode: pin };
      if (pin.length === 6) {
        const r = lookupPincode(pin);
        if (r.ok) {
          if (r.area.city !== "Your area" && !p.city) next.city = r.area.city;
          if (!p.state) next.state = r.area.state;
        }
      }
      return next;
    });
    setErrors((e) => ({ ...e, pincode: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (d.name.trim().length < 2) err.name = "Enter the recipient’s name.";
    if (!/^[6-9]\d{9}$/.test(d.mobile)) err.mobile = "Enter a valid 10-digit mobile number.";
    const pin = lookupPincode(d.pincode);
    if (!pin.ok) err.pincode = pin.reason === "format" ? "Enter a valid 6-digit pincode." : "We don’t deliver to this pincode yet.";
    if (d.line1.trim().length < 5) err.line1 = "Enter the flat / house number and street.";
    if (!d.city.trim()) err.city = "Enter the city.";
    if (!d.state) err.state = "Choose a state.";
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    onSaved(saveAddress({ ...d, id: initial?.id, name: d.name.trim(), line1: d.line1.trim(), city: d.city.trim() }));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Full name" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Input label="Mobile number" inputMode="numeric" autoComplete="tel-national" maxLength={10} prefix="+91" value={d.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} error={errors.mobile} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input label="Pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={d.pincode} onChange={(e) => onPin(e.target.value)} error={errors.pincode} hint="Try 400050 or 560034" />
        <Input fieldClassName="sm:col-span-2" label="Flat / house no., building, street" autoComplete="address-line1" value={d.line1} onChange={(e) => set("line1", e.target.value)} error={errors.line1} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Area / locality" autoComplete="address-line2" optional value={d.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} />
        <Input label="Landmark" optional value={d.landmark ?? ""} onChange={(e) => set("landmark", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="City" autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} error={errors.city} />
        <Select label="State" autoComplete="address-level1" value={d.state} onChange={(e) => set("state", e.target.value)} error={errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (<option key={s}>{s}</option>))}
        </Select>
      </div>
      <fieldset>
        <legend className="mb-2 text-[12.5px] font-medium">Address type</legend>
        <div className="flex gap-2">
          {(["home", "work", "other"] as const).map((t) => (
            <label key={t} className={cn("tap inline-flex h-11 min-w-24 cursor-pointer items-center justify-center border px-5 text-[13.5px] font-medium capitalize transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", d.type === t ? "border-ink bg-ink text-bone" : "border-line-strong text-ink hover:border-ink")}>
              <input type="radio" name="addr-type" className="sr-only" checked={d.type === t} onChange={() => set("type", t)} />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <Checkbox checked={d.isDefault} onChange={(v) => set("isDefault", v)} label="Make this my default address" />
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" size="lg">{initial ? "Save changes" : "Save address"}</Button>
        {onCancel && <Button variant="ghost" size="lg" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
