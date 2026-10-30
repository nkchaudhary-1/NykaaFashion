"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Check, CreditCard, Landmark, Pencil, Plus, ShieldAlert, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { PriceSummary } from "@/components/commerce/PriceSummary";
import { Button, LinkButton } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Input, Radio, Select } from "@/components/ui/Form";
import { Img } from "@/components/ui/Img";
import { Skeleton } from "@/components/ui/Skeleton";
import { SimulatedNotice } from "@/components/ui/Simulated";
import { EmptyState } from "@/components/ui/States";
import { Stepper } from "@/components/ui/Stepper";
import { COD_FEE, EXPRESS_SHIPPING, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING, lookupPincode } from "@/data/commerce";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DAY, nowMs, useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { fmtDate, inr } from "@/lib/format";
import { BANKS, WALLETS, cardBrand, formatCard, formatExpiry, luhn, simulateOutcome, validExpiry, validUpi } from "@/lib/payments";
import { priceBag } from "@/lib/pricing";
import { track } from "@/lib/track";
import { placeOrder, type Address, type PayMethod } from "@/stores/account";
import { clearBag, useBag } from "@/stores/commerce";
import { patchCheckout, resetCheckout, useCheckout } from "@/stores/checkout";
import { toast } from "@/stores/ui";

const STEPS = ["Address", "Payment", "Review"];
const COD_LIMIT = 50000;

const METHODS: Array<{ id: PayMethod; label: string; sub: string; Icon: typeof Smartphone }> = [
  { id: "upi", label: "UPI", sub: "Pay with any UPI app", Icon: Smartphone },
  { id: "card", label: "Credit / debit card", sub: "Visa, Mastercard, RuPay, Amex", Icon: CreditCard },
  { id: "netbanking", label: "Net banking", sub: "All major banks", Icon: Landmark },
  { id: "wallet", label: "Wallets", sub: "Paytm, PhonePe and more", Icon: Wallet },
  { id: "cod", label: "Cash on delivery", sub: `${inr(COD_FEE)} handling fee`, Icon: Banknote },
];

export function CheckoutFlow() {
  const router = useRouter();
  const { ready, user, addresses } = useRequireAuth();
  const { lines, coupon } = useBag();
  const co = useCheckout();
  const now = useNow();
  const [placed, setPlaced] = useState(false);

  // Local, never-persisted payment inputs.
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [perr, setPerr] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "failed">("idle");
  const [failReason, setFailReason] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);

  if (!ready || !user) return <CheckoutSkeleton />;
  if (lines.length === 0 && !placed) {
    return <EmptyState title="Your bag is empty" text="Add something to your bag to check out." actions={<LinkButton href="/edits" size="lg">Explore the edits</LinkButton>} />;
  }

  const address = addresses.find((a) => a.id === co.addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const area = address ? lookupPincode(address.pincode) : null;
  const codAllowed = !!(area && area.ok && area.area.cod);
  const price = priceBag(lines, { coupon, delivery: co.delivery, cod: co.method === "cod" });
  const unavailable = lines.some((l) => l.stock === 0);
  const eta = (days: number) => fmtDate(now + days * DAY, { weekday: "short", day: "numeric", month: "short" });
  const stdDays = area && area.ok ? area.area.days : 5;
  const goto = (s: 0 | 1 | 2) => {
    patchCheckout({ step: s });
    track("checkout_step", { step: STEPS[s] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step 1 → 2 ─────────────────────────────────────────────
  const continueAddress = () => {
    if (!address) return setAddrError("Add a delivery address to continue.");
    if (!area || !area.ok) return setAddrError("We don’t deliver to this pincode yet. Choose another address.");
    setAddrError(null);
    patchCheckout({ addressId: address.id });
    goto(1);
  };

  // ── Step 2 → 3 ─────────────────────────────────────────────
  const continuePayment = () => {
    const e: Record<string, string> = {};
    if (!co.method) e.method = "Choose a payment method.";
    if (co.method === "upi" && !validUpi(upi)) e.upi = "Enter a valid UPI ID, e.g. name@okbank.";
    if (co.method === "card") {
      if (!luhn(card.number)) e.number = "Enter a valid card number.";
      if (card.name.trim().length < 2) e.cname = "Enter the name on the card.";
      if (!validExpiry(card.expiry, nowMs())) e.expiry = "Enter a valid, unexpired date (MM/YY).";
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = "Enter the 3–4 digit CVV.";
    }
    if (co.method === "netbanking" && !co.bank) e.bank = "Choose your bank.";
    if (co.method === "wallet" && !co.wallet) e.wallet = "Choose a wallet.";
    if (co.method === "cod" && (!codAllowed || price.total > COD_LIMIT)) e.method = codAllowed ? `Cash on delivery is limited to ${inr(COD_LIMIT)}.` : "Cash on delivery isn’t available for this pincode.";
    setPerr(e);
    if (Object.keys(e).length) return void document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    goto(2);
  };

  const detail = (): string => {
    switch (co.method) {
      case "upi": return upi.trim();
      case "card": return `${cardBrand(card.number) ?? "Card"} •••• ${card.number.replace(/\D/g, "").slice(-4)}`;
      case "netbanking": return co.bank;
      case "wallet": return co.wallet;
      default: return "Cash on delivery";
    }
  };

  // ── Place order (simulated) ────────────────────────────────
  const place = () => {
    if (!address || !co.method || status === "processing") return;
    setStatus("processing");
    setFailReason("");
    setTimeout(() => {
      const outcome = simulateOutcome(co.method!, { upi, card: card.number });
      if (!outcome.ok) {
        setStatus("failed");
        setFailReason(outcome.reason);
        return;
      }
      const order = placeOrder({ lines, address, payment: { method: co.method!, detail: detail() }, delivery: co.delivery, coupon: price.couponCode, pricing: price });
      if (!order) {
        setStatus("failed");
        setFailReason("Your session ended. Sign in again to place the order.");
        return;
      }
      setPlaced(true);
      track("order_placed", { orderId: order.id, total: price.total, method: co.method! });
      clearBag();
      resetCheckout();
      router.push(`/checkout/confirmation/${order.id}`);
    }, 1800);
  };

  const step = co.step;
  const selectedMethod = METHODS.find((m) => m.id === co.method);

  return (
    <div className="container-x pb-20">
      <Stepper steps={STEPS} current={step} className="mb-10" />
      <SimulatedNotice className="mb-10">
        <strong>Simulated checkout.</strong> No payment is taken and no order is placed with anyone. Don’t enter real card details — use the test values shown.
      </SimulatedNotice>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-20">
        <div className="space-y-6">
          {/* ── 1 Address ─────────────────────────────── */}
          <section aria-labelledby="s-addr" className="border border-line bg-paper">
            <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
              <h2 id="s-addr" className="display-xs flex items-center gap-3">
                <span className={cn("inline-flex size-7 items-center justify-center rounded-full border text-[12px]", step > 0 ? "border-ink bg-ink text-bone" : "border-ink")}>{step > 0 ? <Check size={14} /> : 1}</span>
                Address &amp; delivery
              </h2>
              {step > 0 && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => goto(0)}>Change</Button>}
            </header>
            {step === 0 ? (
              <div className="border-t border-line px-5 py-6 sm:px-7">
                {addresses.length > 0 && !adding && (
                  <div role="radiogroup" aria-label="Delivery address" className="grid gap-3">
                    {addresses.map((a) => (
                      <Radio key={a.id} name="address" checked={address?.id === a.id} onChange={() => patchCheckout({ addressId: a.id })} label={<span className="flex items-center gap-2">{a.name}<span className="inline-flex h-5 items-center bg-sand px-2 text-[10px] font-medium uppercase tracking-wider text-ink-2">{a.type}</span>{a.isDefault && <span className="text-[11px] text-ink-3">Default</span>}</span>} sub={<AddressLine a={a} />} />
                    ))}
                  </div>
                )}
                {(adding || addresses.length === 0) ? (
                  <div className="mt-2">
                    <h3 className="mb-5 text-[15px] font-medium">{addresses.length ? "New address" : "Where should we deliver?"}</h3>
                    <AddressForm defaults={{ name: user.name, mobile: user.mobile }} onSaved={(a) => (patchCheckout({ addressId: a.id }), setAdding(false), toast({ title: "Address saved" }))} onCancel={addresses.length ? () => setAdding(false) : undefined} />
                  </div>
                ) : (
                  <Button variant="secondary" className="mt-4" icon={<Plus size={15} />} onClick={() => setAdding(true)}>Add a new address</Button>
                )}

                {address && !adding && (
                  <fieldset className="mt-9">
                    <legend className="mb-3 text-[14px] font-medium">Delivery speed</legend>
                    {area && !area.ok && <p role="alert" className="mb-3 text-[13px] font-medium text-danger">We don’t deliver to {address.pincode} yet.</p>}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Radio name="delivery" checked={co.delivery === "standard"} onChange={() => patchCheckout({ delivery: "standard" })} label="Standard" sub={`Delivery by ${eta(stdDays)}`} right={price.itemCount && priceBag(lines, { coupon, delivery: "standard" }).shipping === 0 ? "Free" : inr(STANDARD_SHIPPING)} />
                      <Radio name="delivery" checked={co.delivery === "express"} onChange={() => patchCheckout({ delivery: "express" })} label="Express" sub={`Delivery by ${eta(Math.max(1, stdDays - 2))}`} right={inr(EXPRESS_SHIPPING)} />
                    </div>
                    <p className="mt-3 text-[12.5px] text-ink-3">Standard delivery is free above {inr(FREE_SHIPPING_THRESHOLD)}. Dates are simulated from your pincode.</p>
                  </fieldset>
                )}
                {addrError && <p role="alert" className="mt-4 text-[13.5px] font-medium text-danger">{addrError}</p>}
                {!adding && addresses.length > 0 && <Button size="lg" className="mt-8" onClick={continueAddress}>Continue to payment</Button>}
              </div>
            ) : (
              address && <p className="border-t border-line px-5 py-4 text-[14px] text-ink-2 sm:px-7"><strong className="font-medium text-ink">{address.name}</strong> · <AddressLine a={address} /> · <span className="capitalize">{co.delivery}</span> delivery</p>
            )}
          </section>

          {/* ── 2 Payment ─────────────────────────────── */}
          <section aria-labelledby="s-pay" className="border border-line bg-paper">
            <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
              <h2 id="s-pay" className={cn("display-xs flex items-center gap-3", step < 1 && "text-ink-3")}>
                <span className={cn("inline-flex size-7 items-center justify-center rounded-full border text-[12px]", step > 1 ? "border-ink bg-ink text-bone" : step === 1 ? "border-ink" : "border-line-strong text-ink-3")}>{step > 1 ? <Check size={14} /> : 2}</span>
                Payment
              </h2>
              {step > 1 && <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => goto(1)}>Change</Button>}
            </header>
            {step === 1 && (
              <div className="border-t border-line px-5 py-6 sm:px-7">
                <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
                  {METHODS.map(({ id, label, sub, Icon }) => {
                    const disabled = id === "cod" && !codAllowed;
                    return (
                      <div key={id} className={cn(disabled && "pointer-events-none opacity-50")}>
                        <Radio name="pay" checked={co.method === id} onChange={() => (patchCheckout({ method: id }), setPerr({}))} label={<span className="flex items-center gap-3"><Icon size={18} aria-hidden />{label}</span>} sub={disabled ? "Not available for your pincode" : sub} />
                        {co.method === id && (
                          <div className="border-x border-b border-ink bg-white px-5 pb-5 pt-5">
                            {id === "upi" && <Input label="UPI ID" autoComplete="off" placeholder="name@okbank" value={upi} onChange={(e) => (setUpi(e.target.value), setPerr({}))} error={perr.upi} hint="Test: any valid ID succeeds · fail@upi is declined" />}
                            {id === "card" && (
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Input fieldClassName="sm:col-span-2" label="Card number" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => (setCard({ ...card, number: formatCard(e.target.value) }), setPerr({}))} error={perr.number} hint="Test: 4242 4242 4242 4242 succeeds · 4000 0000 0000 0002 is declined" />
                                <Input fieldClassName="sm:col-span-2" label="Name on card" autoComplete="off" value={card.name} onChange={(e) => (setCard({ ...card, name: e.target.value }), setPerr({}))} error={perr.cname} />
                                <Input label="Expiry (MM/YY)" inputMode="numeric" autoComplete="off" placeholder="12/30" maxLength={5} value={card.expiry} onChange={(e) => (setCard({ ...card, expiry: formatExpiry(e.target.value) }), setPerr({}))} error={perr.expiry} />
                                <Input label="CVV" inputMode="numeric" autoComplete="off" type="password" maxLength={4} placeholder="•••" value={card.cvv} onChange={(e) => (setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") }), setPerr({}))} error={perr.cvv} />
                              </div>
                            )}
                            {id === "netbanking" && (
                              <Select label="Choose your bank" value={co.bank} onChange={(e) => patchCheckout({ bank: e.target.value })} error={perr.bank}>
                                <option value="">Select a bank</option>
                                {BANKS.map((b) => (<option key={b}>{b}</option>))}
                              </Select>
                            )}
                            {id === "wallet" && (
                              <Select label="Choose a wallet" value={co.wallet} onChange={(e) => patchCheckout({ wallet: e.target.value })} error={perr.wallet}>
                                <option value="">Select a wallet</option>
                                {WALLETS.map((b) => (<option key={b}>{b}</option>))}
                              </Select>
                            )}
                            {id === "cod" && <p className="text-[14px] text-ink-2">Pay {inr(price.total)} in cash when your order arrives. A {inr(COD_FEE)} handling fee applies. <span className="text-ink-3">(Simulated — no order is placed.)</span></p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {perr.method && <p role="alert" className="mt-4 text-[13.5px] font-medium text-danger">{perr.method}</p>}
                <Button size="lg" className="mt-8" onClick={continuePayment}>Review order</Button>
              </div>
            )}
            {step > 1 && selectedMethod && <p className="border-t border-line px-5 py-4 text-[14px] text-ink-2 sm:px-7"><strong className="font-medium text-ink">{selectedMethod.label}</strong> · {detail()}</p>}
          </section>

          {/* ── 3 Review ──────────────────────────────── */}
          <section aria-labelledby="s-rev" className="border border-line bg-paper">
            <header className="px-5 py-5 sm:px-7">
              <h2 id="s-rev" className={cn("display-xs flex items-center gap-3", step < 2 && "text-ink-3")}>
                <span className={cn("inline-flex size-7 items-center justify-center rounded-full border text-[12px]", step === 2 ? "border-ink" : "border-line-strong text-ink-3")}>3</span>
                Review &amp; place order
              </h2>
            </header>
            {step === 2 && (
              <div className="border-t border-line px-5 py-6 sm:px-7">
                {status === "failed" && (
                  <div role="alert" className="mb-6 flex gap-3 border border-danger bg-danger-tint p-4 text-danger">
                    <ShieldAlert size={20} className="mt-0.5 shrink-0" aria-hidden />
                    <div>
                      <p className="font-medium">Payment didn’t go through</p>
                      <p className="mt-1 text-[13.5px]">{failReason} Nothing was charged. Try again or choose another method.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="danger" onClick={place}>Try again</Button>
                        <Button size="sm" variant="ghost" onClick={() => (setStatus("idle"), goto(1))}>Change payment method</Button>
                      </div>
                    </div>
                  </div>
                )}
                {unavailable && <p role="alert" className="mb-5 text-[13.5px] font-medium text-danger">An item in your bag is no longer available. <Link href="/bag" className="underline underline-offset-4">Review your bag</Link>.</p>}
                <ul aria-label="Items in this order" className="divide-y divide-line">
                  {lines.map((l) => (
                    <li key={l.id} className="flex gap-4 py-4 first:pt-0">
                      <div className="w-16 shrink-0"><Img imgKey={l.variantData.images[0]} alt="" sizes="64px" ratio="4/5" /></div>
                      <div className="min-w-0 flex-1 text-[14px]"><p className="line-clamp-2">{l.product.name}</p><p className="mt-1 text-[12.5px] text-ink-3">{l.variantData.colorName}{l.size !== "One size" && ` · ${l.size}`} · Qty {l.qty}</p></div>
                      <p className="text-[14px] tabular-nums">{inr(l.product.price * l.qty)}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[13px] text-ink-3">By placing this simulated order you acknowledge it is a prototype: nothing is bought, shipped or charged.</p>
                <Button size="lg" full className="mt-5 sm:w-auto sm:min-w-[320px]" loading={status === "processing"} disabled={unavailable} onClick={place}>
                  {status === "processing" ? "Processing…" : `Place order (simulated) · ${inr(price.total)}`}
                </Button>
                {status === "processing" && <p role="status" className="mt-3 text-[13px] text-ink-3">Contacting your (pretend) bank…</p>}
              </div>
            )}
          </section>
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <Disclosure title={<span className="text-[15px]">Order summary · {inr(price.total)}</span>} defaultOpen className="border border-line bg-paper px-5 [&>h3]:py-1 lg:hidden" headingLevel={2}>
            <SummaryBody lines={lines} price={price} />
          </Disclosure>
          <div className="hidden border border-line bg-paper p-6 lg:block">
            <h2 className="mb-4 text-[15px] font-medium">Order summary</h2>
            <SummaryBody lines={lines} price={price} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryBody({ lines, price }: { lines: ReturnType<typeof useBag>["lines"]; price: ReturnType<typeof priceBag> }) {
  return (
    <>
      <ul className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Items">
        {lines.map((l) => (
          <li key={l.id} className="relative w-14 shrink-0">
            <Img imgKey={l.variantData.images[0]} alt={l.product.name} sizes="56px" ratio="4/5" />
            {l.qty > 1 && <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-bone">{l.qty}</span>}
          </li>
        ))}
      </ul>
      <PriceSummary b={price} />
      <Link href="/bag" className="link-u mt-4 inline-block text-[12.5px] font-medium">Edit bag</Link>
    </>
  );
}

function AddressLine({ a }: { a: Address }) {
  return <span>{[a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ")}</span>;
}

function CheckoutSkeleton() {
  return (
    <div className="container-x pb-20" role="status" aria-label="Loading checkout">
      <Skeleton className="mb-10 h-7 w-72" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
