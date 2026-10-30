"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Input, Textarea } from "@/components/ui/Form";
import { FAQS } from "@/data/content";
import { nowMs } from "@/lib/clock";
import { prefsStore, toast } from "@/stores/ui";

export function HelpCentre() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) err.email = "Enter a valid email address.";
    if (f.message.trim().length < 10) err.message = "Tell us a little more (at least 10 characters).";
    setErrors(err);
    if (Object.keys(err).length) return;
    prefsStore.set((p) => ({ ...p, messages: [{ ...f, at: nowMs() }, ...p.messages] }));
    setSent(true);
    toast({ title: "Message saved", description: "Simulated — stored on this device only." });
  };
  return (
    <div className="container-x grid gap-16 pb-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-24">
      <section aria-labelledby="faq">
        <h2 id="faq" className="display-sm mb-6">Questions, answered.</h2>
        <div className="border-t border-line">
          {FAQS.map((q, i) => (<Disclosure key={q.q} title={q.q} defaultOpen={i === 0}><p>{q.a}</p></Disclosure>))}
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-3 text-[14px]">
          {[["/info/shipping", "Shipping & delivery"], ["/info/returns", "Returns & refunds"], ["/account/orders", "Track an order"]].map(([href, label]) => (
            <li key={href}><Link href={href} className="flex h-14 items-center justify-between border border-line px-4 hover:border-ink">{label} <span aria-hidden>→</span></Link></li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="msg" className="lg:pt-1">
        <h2 id="msg" className="display-sm mb-6">Still need a hand?</h2>
        {sent ? (
          <div role="status" className="border border-line bg-paper p-8">
            <Check size={24} aria-hidden className="mb-4" />
            <p className="display-xs">Thanks — we’ve noted it.</p>
            <p className="mt-2 text-[14px] text-ink-2">In this prototype your message is stored on your device only. In a real service, someone would reply within a day.</p>
            <Button variant="secondary" className="mt-6" onClick={() => (setSent(false), setF({ name: "", email: "", message: "" }))}>Send another</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <Input label="Your name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
            <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
            <Textarea label="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={errors.message} />
            <Button type="submit" size="lg">Send message</Button>
          </form>
        )}
      </section>
    </div>
  );
}
