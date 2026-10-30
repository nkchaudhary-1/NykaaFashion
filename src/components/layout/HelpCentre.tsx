"use client";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, MessageCircle, Minus, PackageSearch, Plus, Ruler, Truck, Undo2, type LucideIcon } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { FAQS } from "@/data/content";
import { cn } from "@/lib/cn";
import { nowMs } from "@/lib/clock";
import { prefsStore, toast } from "@/stores/ui";

const faq = (re: RegExp) => FAQS.findIndex((f) => re.test(f.q));

/** Help topics: a tile either opens a page or jumps to (and opens) the matching question below. */
const TOPICS: Array<{ Icon: LucideIcon; title: string; text: string; href: string }> = [
  { Icon: Truck, title: "Shipping & delivery", text: "Delivery options, timings and cash on delivery.", href: "/info/shipping" },
  { Icon: Undo2, title: "Returns & refunds", text: "How returns and refunds work, step by step.", href: "/info/returns" },
  { Icon: PackageSearch, title: "Track an order", text: "Follow an order through the simulated tracker.", href: "/account/orders" },
  { Icon: CreditCard, title: "Payments & checkout", text: "What is simulated, and the test values to use.", href: `#faq-${Math.max(0, faq(/payments/i))}` },
  { Icon: Ruler, title: "Sizing & fit", text: "Size guides and fit notes on every product.", href: `#faq-${Math.max(0, faq(/size/i))}` },
  { Icon: MessageCircle, title: "Contact us", text: "Send us a message — it stays on this device.", href: "#msg" },
];

const QUICK = [
  ["/info/shipping", "Shipping & delivery"],
  ["/info/returns", "Returns & refunds"],
  ["/account/orders", "Track an order"],
];

function Tile({ Icon, title, text, href }: (typeof TOPICS)[number]) {
  const cls = "group flex h-full min-h-[132px] flex-col justify-between gap-6 border border-ink p-4 transition-colors hover:bg-ink hover:text-bone sm:min-h-[168px] sm:p-5";
  const body = (
    <>
      <span className="flex items-start justify-between">
        <Icon size={24} strokeWidth={1.4} aria-hidden className="text-pink-ink transition-colors group-hover:text-white" />
        <ArrowUpRight size={18} aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
      <span>
        <span className="block text-[16px] font-medium leading-tight tracking-[-0.015em] sm:text-[19px]">{title}</span>
        <span className="mt-2 hidden max-w-[34ch] text-[13.5px] leading-snug text-ink-3 transition-colors group-hover:text-bone sm:block">{text}</span>
      </span>
    </>
  );
  // In-page anchors are plain links so the browser scrolls and fires hashchange (the questions listen for it).
  return href.startsWith("#") ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

export function HelpCentre() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState<number[]>([0]);

  // A link to #faq-N opens that question and brings it into view.
  useEffect(() => {
    const sync = () => {
      const m = /^#faq-(\d+)$/.exec(window.location.hash);
      if (!m) return;
      const i = Number(m[1]);
      setOpen((o) => (o.includes(i) ? o : [...o, i]));
      requestAnimationFrame(() => document.getElementById(`faq-${i}`)?.scrollIntoView({ block: "center" }));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Up / Down / Home / End move between the question buttons (Tab still walks them in order).
  const onKeys = (e: KeyboardEvent<HTMLOListElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key) || !(e.target instanceof HTMLButtonElement) || !e.target.id.startsWith("faq-")) return;
    e.preventDefault();
    const i = Number(e.target.id.slice(4));
    const j = e.key === "Home" ? 0 : e.key === "End" ? FAQS.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + FAQS.length) % FAQS.length;
    document.getElementById(`faq-${j}`)?.focus();
  };

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
    <>
      {/* Topics: six tiles — three across on desktop, two across below */}
      <section aria-label="Help topics" className="container-x pb-14 sm:pb-20">
        <Grid as="ul" className="gap-y-[var(--gap)]">
          {TOPICS.map((t) => (
            <Col as="li" key={t.title} span={{ base: 2, sm: 6, lg: 4 }}>
              <Tile {...t} />
            </Col>
          ))}
        </Grid>
      </section>

      {/* 3 / 9: the rail (sticky on desktop) | the questions and the message form */}
      <div className="container-x pb-4 sm:pb-8">
        <Grid className="gap-y-10">
          <Col span={{ base: 4, sm: 12, lg: 3 }} rowStart={{ lg: 1 }} className="hidden lg:sticky lg:top-[calc(var(--header-offset)+24px)] lg:block lg:self-start">
            <nav aria-label="On this page">
              <p className="eyebrow mb-3 text-ink-3">On this page</p>
              <ol className="space-y-1">
                {[
                  ["#faq", "Questions, answered"],
                  ["#msg", "Still need a hand?"],
                ].map(([href, label], i) => (
                  <li key={href}>
                    <a href={href} className="link-u tap flex items-baseline gap-3 py-1.5 text-[14px] text-ink">
                      <span className="text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <nav aria-label="Quick links" className="mt-10">
              <p className="eyebrow mb-3 text-ink-3">Quick links</p>
              <ul>
                {QUICK.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="tap flex items-center justify-between border-l-2 border-line py-2 pl-4 text-[14px] text-ink-3 transition-colors hover:border-ink hover:text-ink">
                      {label} <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Col>

          <Col span={{ base: 4, sm: 12, lg: 9 }} start={{ lg: 4 }} rowStart={{ lg: 1 }}>
            <section id="faq" aria-labelledby="faq-h">
              <h2 id="faq-h" className="display-sm mb-8">
                Questions, answered.
              </h2>
              <ol className="border-b border-line" onKeyDown={onKeys}>
                {FAQS.map((q, i) => {
                  const isOpen = open.includes(i);
                  return (
                    <li key={q.q} className="border-t border-ink">
                      <h3 className="m-0">
                        <button
                          type="button"
                          id={`faq-${i}`}
                          aria-expanded={isOpen}
                          aria-controls={`faq-${i}-panel`}
                          onClick={() => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))}
                          className="grid min-h-16 w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-5 text-left lg:grid-cols-9 lg:gap-x-[var(--gap)]"
                        >
                          <span className="text-[12px] tabular-nums text-ink-3 lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-[17px] font-medium leading-snug tracking-[-0.015em] sm:text-[19px] lg:col-span-7">{q.q}</span>
                          <span aria-hidden className="inline-flex size-8 items-center justify-center self-center justify-self-end border border-ink lg:col-span-1">
                            {isOpen ? <Minus size={16} strokeWidth={1.6} /> : <Plus size={16} strokeWidth={1.6} />}
                          </span>
                        </button>
                      </h3>
                      {/* grid-rows 0fr → 1fr is a flat height animation with no library; `inert` keeps closed answers out of the tab order and the reading order */}
                      <div id={`faq-${i}-panel`} role="region" aria-labelledby={`faq-${i}`} inert={!isOpen} className={cn("grid transition-[grid-template-rows] duration-300 ease-editorial", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 pb-7 lg:grid-cols-9 lg:gap-x-[var(--gap)]">
                            <p className="col-start-2 max-w-[62ch] text-[15.5px] leading-[1.7] text-ink-2 lg:col-span-7 lg:col-start-2">{q.a}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section id="msg" aria-labelledby="msg-h" className="mt-16 grid grid-cols-1 gap-x-[var(--gap)] gap-y-6 border-t border-ink pt-8 sm:mt-24 lg:grid-cols-9">
              <div className="lg:col-span-3">
                <h2 id="msg-h" className="display-sm">
                  Still need a hand?
                </h2>
                <p className="mt-3 max-w-[32ch] text-[14px] leading-relaxed text-ink-2">Tell us what happened. Messages are simulated: they are saved on this device only.</p>
              </div>
              <div className="lg:col-span-6">
                {sent ? (
                  <div role="status" className="border border-ink bg-sand p-8">
                    <Check size={24} aria-hidden className="mb-4" />
                    <p className="display-xs">Thanks — we’ve noted it.</p>
                    <p className="mt-2 max-w-[46ch] text-[14px] text-ink-2">In this prototype your message is stored on your device only. In a real service, someone would reply within a day.</p>
                    <Button variant="secondary" className="mt-6" onClick={() => (setSent(false), setF({ name: "", email: "", message: "" }))}>
                      Send another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-[var(--gap)]">
                      <Input label="Your name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
                      <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
                    </div>
                    <Textarea label="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={errors.message} />
                    <Button type="submit" size="lg">
                      Send message
                    </Button>
                  </form>
                )}
              </div>
            </section>
          </Col>
        </Grid>
      </div>
    </>
  );
}
