"use client";
import { CreditCard, Plus, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { focusNeighbour } from "@/components/account/focus";
import { addCard, addUpi, removeMethod, useSavedPayments, type SavedMethod } from "@/components/account/payments";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/format";
import { validUpi } from "@/lib/payments";
import { toast } from "@/stores/ui";

const act = "tap inline-flex h-10 items-center gap-1.5 px-2 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-sand hover:text-ink [@media(pointer:coarse)]:h-11";
const BRANDS = ["Visa", "Mastercard", "RuPay", "Amex"];

/**
 * Saved payments (the account menu's "Saved Payments"): a 3-up card grid like Addresses, plus an add dialog. Entirely simulated —
 * only a UPI handle or a card's brand and last four digits is kept, on this device, and the page says so.
 */
export function SavedPaymentsView() {
  const { user, methods } = useSavedPayments();
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  // "Remove" turns into "Remove this method? · Remove · Keep": the button that was pressed is gone, so land on the safe choice.
  useEffect(() => {
    if (confirm) list.current?.querySelector<HTMLElement>("[data-keep]")?.focus({ preventScroll: true });
  }, [confirm]);
  if (!user) return null;
  const uid = user.id;
  const keep = (id: string) => {
    setConfirm(null);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-del="${id}"]`)?.focus({ preventScroll: true }));
  };
  return (
    <section aria-labelledby="sp-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="sp-h" className="text-[24px] font-semibold tracking-[-0.015em]">Saved payments</h2>
        <Button icon={<Plus size={16} aria-hidden />} onClick={() => setAdding(true)}>Add payment method</Button>
      </div>
      <SimulatedNotice className="mt-5 max-w-[62ch]">
        <strong>Simulated.</strong> Nothing here is a real payment method. Only a UPI ID, or a card’s brand and last four digits, is kept — on this device — and never a full number, expiry or CVV. Please don’t enter real details.
      </SimulatedNotice>

      {methods.length === 0 ? (
        <EmptyState visual={<CreditCard size={40} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />} title="No saved payments yet" text="Save a UPI ID or a test card and it will be one tap at checkout." actions={<Button size="lg" onClick={() => setAdding(true)}>Add payment method</Button>} className="py-14" />
      ) : (
        <ul ref={list} className="mt-8 grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <li key={m.id} className="flex flex-col justify-between gap-6 rounded-[var(--radius-sm)] border border-line-strong bg-white p-5 sm:p-6">
              <div>
                <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] bg-sand text-ink-2">
                  {m.kind === "upi" ? <Smartphone size={20} strokeWidth={1.5} aria-hidden /> : <CreditCard size={20} strokeWidth={1.5} aria-hidden />}
                </span>
                <p className="mt-4 text-[16px] font-semibold">{m.kind === "upi" ? "UPI" : m.brand}</p>
                <p className="mt-1 break-all text-[15px] tabular-nums text-ink-2">{m.kind === "upi" ? m.upi : `•••• •••• •••• ${m.last4}`}</p>
                <p className="mt-2 text-[12.5px] text-ink-3">{m.addedAt ? `Added ${fmtDate(m.addedAt, { day: "numeric", month: "short", year: "numeric" })}` : "Used on a past order"} · simulated</p>
              </div>
              {confirm === m.id ? (
                <div role="alert" className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="mr-auto text-[14px] text-ink-2">Remove this method?</span>
                  <Button variant="danger" size="sm" onClick={(e) => (focusNeighbour(e.currentTarget), removeMethod(uid, m.id), setConfirm(null), toast({ title: "Payment method removed" }))}>Remove</Button>
                  <Button variant="ghost" size="sm" data-keep onClick={() => keep(m.id)}>Keep</Button>
                </div>
              ) : (
                <div className="-mx-2 flex items-center border-t border-line pt-3">
                  <button type="button" data-del={m.id} className={cn(act, "hover:text-danger")} onClick={() => setConfirm(m.id)} aria-label={`Remove ${m.kind === "upi" ? m.upi : `${m.brand} ending ${m.last4}`}`}>
                    <Trash2 size={15} aria-hidden /> Remove
                  </button>
                </div>
              )}
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setAdding(true)} className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-line-strong p-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink hover:bg-paper">
              <Plus size={22} strokeWidth={1.4} aria-hidden /> Add a new method
            </button>
          </li>
        </ul>
      )}

      <Overlay open={adding} onClose={() => setAdding(false)} label="Add payment method" side="center" panelClassName="sm:w-[min(94vw,520px)]">
        <OverlayHeader title="Add payment method" sub="Simulated — don’t enter real details." />
        <OverlayBody>
          {adding && <AddMethod key="add" onAdd={(m) => (m.kind === "upi" ? addUpi(uid, m.upi) : addCard(uid, m.brand, m.last4), toast({ title: "Payment method saved", description: "Simulated — kept on this device only." }), setAdding(false))} onCancel={() => setAdding(false)} />}
        </OverlayBody>
      </Overlay>
    </section>
  );
}

type NewMethod = Pick<Extract<SavedMethod, { kind: "upi" }>, "kind" | "upi"> | Pick<Extract<SavedMethod, { kind: "card" }>, "kind" | "brand" | "last4">;

function AddMethod({ onAdd, onCancel }: { onAdd: (m: NewMethod) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<"upi" | "card">("upi");
  const [upi, setUpi] = useState("");
  const [brand, setBrand] = useState(BRANDS[0]);
  const [last4, setLast4] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "upi") {
      if (!validUpi(upi)) return setErr("Enter a valid UPI ID, e.g. name@okbank.");
      onAdd({ kind: "upi", upi: upi.trim() });
    } else {
      if (!/^\d{4}$/.test(last4)) return setErr("Enter the last 4 digits of the card.");
      onAdd({ kind: "card", brand, last4 });
    }
  };
  const tab = (k: "upi" | "card", label: string) => (
    <label className={cn("tap inline-flex h-10 cursor-pointer items-center rounded-full border px-5 text-[14px] font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", kind === k ? "border-ink bg-ink text-white" : "border-line-strong text-ink hover:border-ink")}>
      <input type="radio" name="pm-kind" className="sr-only" checked={kind === k} onChange={() => (setKind(k), setErr(null))} />
      {label}
    </label>
  );
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Type</legend>
        <div className="flex gap-2">{tab("upi", "UPI")}{tab("card", "Card")}</div>
      </fieldset>
      {kind === "upi" ? (
        <Input label="UPI ID" autoComplete="off" placeholder="name@okbank" value={upi} onChange={(e) => (setUpi(e.target.value), setErr(null))} error={err} hint="Test: any valid ID works · fail@upi is declined at checkout" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select label="Card brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
            {BRANDS.map((b) => (<option key={b}>{b}</option>))}
          </Select>
          <Input label="Last 4 digits" inputMode="numeric" autoComplete="off" placeholder="4242" value={last4} onChange={(e) => (setLast4(e.target.value.replace(/\D/g, "").slice(0, 4)), setErr(null))} error={err} hint="Only the last four digits are kept." />
        </div>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" size="lg">Save method</Button>
        <Button variant="ghost" size="lg" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
