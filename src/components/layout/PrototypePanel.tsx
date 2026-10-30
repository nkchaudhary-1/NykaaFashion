"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Switch } from "@/components/ui/Form";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { SimulatedTag } from "@/components/ui/Simulated";
import { categoryById } from "@/data/categories";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import { HOME_MODULES, MODE_COPY, composeHome } from "@/lib/home";
import { fmtDateTime } from "@/lib/format";
import { resetAllStores, useStore } from "@/lib/store";
import { eventsStore } from "@/lib/track";
import { accountStore } from "@/stores/account";
import { INTENT_INITIAL, dealStore, intentStore, setIntentOverride, topKey, useIntent, type IntentOverride } from "@/stores/intent";
import { setPrefs, setUI, toast, usePrefs, useUI } from "@/stores/ui";
import { cn } from "@/lib/cn";

/**
 * The review controls as a flat drawer on the right: four numbered groups separated by ink rules — session intent, simulated
 * failure states, the analytics log, local data. Opens from the footer, the phone menu or the /prototype page (there is no floating button).
 */
export function PrototypePanel() {
  const { protoOpen } = useUI();
  return (
    <Overlay open={protoOpen} onClose={() => setUI({ protoOpen: false })} label="Prototype controls" side="right">
      <OverlayHeader title="Prototype controls" sub="Review simulated behaviour — nothing leaves this browser." />
      <OverlayBody flush>
        <IntentSection />
        <SimulateSection />
        <EventLog />
        <DataSection />
      </OverlayBody>
      <OverlayFooter>
        <Link href="/prototype" onClick={() => setUI({ protoOpen: false })} className="link-u tap inline-block text-[13px] font-medium">
          Read the prototype notes →
        </Link>
      </OverlayFooter>
    </Overlay>
  );
}

function Group({ n, id, title, aside, children, className }: { n: number; id: string; title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("border-t border-ink px-5 py-6 first:border-t-0 sm:px-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 id={id} className="flex items-baseline gap-3 text-[15px] font-medium">
          <span aria-hidden className="text-[11px] tabular-nums text-ink-3">
            {String(n).padStart(2, "0")}
          </span>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function IntentSection() {
  const { intent, deal, mode } = useIntent();
  const { failModule } = usePrefs();
  const W = intent.weights;
  const cat = topKey(W.category);
  const lab = topKey(W.label);
  const ed = topKey(W.edit);
  const opts: Array<{ id: IntentOverride; name: string }> = [{ id: "auto", name: "Auto (from signals)" }, { id: "cold", name: "Cold start" }, { id: "returning", name: "Returning" }, { id: "deal", name: "Deal intent" }];
  // What the home page is doing right now: the module order for this mode (minus a module you chose to hide below)
  const order = composeHome(mode).filter((s) => s.id !== failModule);
  return (
    <Group n={1} id="p-intent" title="Session intent" aside={<SimulatedTag note="A localStorage heuristic that re-orders the homepage. It is not machine learning." />} className="space-y-4">
      <p className="border-l-2 border-ink pl-3 text-[13px] text-ink-2">
        <strong className="font-semibold text-ink">{MODE_COPY[mode].name}</strong> — {MODE_COPY[mode].blurb}
      </p>
      <fieldset>
        <legend className="sr-only">Override session intent</legend>
        <div className="grid grid-cols-2 gap-2">
          {opts.map((o) => (
            <label key={o.id} className={cn("flex min-h-11 cursor-pointer items-center justify-center border px-3 text-center text-[12.5px] font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", intent.override === o.id ? "border-ink bg-ink text-bone" : "border-line-strong text-ink-2 hover:border-ink")}>
              <input type="radio" name="intent-override" className="sr-only" checked={intent.override === o.id} onChange={() => setIntentOverride(o.id)} />
              {o.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="eyebrow mb-2 text-ink-3">Homepage order now</p>
        <ol aria-label="Homepage module order" className="flex flex-wrap gap-1.5 text-[12px]">
          {order.map((s, i) => (
            <li key={s.id} className={cn("inline-flex h-7 items-center gap-1.5 border px-2", i === 0 ? "border-ink bg-ink text-bone" : "border-line-strong text-ink-2", s.promoted && "border-pink-ink")}>
              <span className="tabular-nums opacity-70">{i + 1}</span>
              {HOME_MODULES.find((m) => m.id === s.id)?.name}
            </li>
          ))}
        </ol>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-[12.5px]">
        <dt className="text-ink-3">Signals logged</dt>
        <dd className="text-right tabular-nums">{intent.events}</dd>
        <dt className="text-ink-3">Deal score</dt>
        <dd className="text-right tabular-nums">
          {intent.dealScore}
          {deal ? " · active" : ""}
        </dd>
        <dt className="text-ink-3">Top category</dt>
        <dd className="text-right">{cat ? (categoryById[cat]?.name ?? cat) : "—"}</dd>
        <dt className="text-ink-3">Top label</dt>
        <dd className="text-right">{lab ? labelById[lab]?.name : "—"}</dd>
        <dt className="text-ink-3">Top edit</dt>
        <dd className="text-right">{ed ? editById[ed]?.title : "—"}</dd>
      </dl>
      <Button variant="secondary" size="sm" icon={<RotateCcw size={13} />} onClick={() => (intentStore.set(INTENT_INITIAL), dealStore.set(null), toast({ title: "Signals cleared", description: "The homepage returns to its cold-start order." }))}>
        Clear signals
      </Button>
    </Group>
  );
}

function SimulateSection() {
  const prefs = usePrefs();
  return (
    <Group n={2} id="p-sim" title="Simulate states" className="space-y-1">
      <Switch label="Slow network" hint="Adds ~1.4 s to simulated requests so skeletons are visible." checked={prefs.slowNetwork} onChange={(v) => setPrefs({ slowNetwork: v })} />
      <Switch label="Fail the next request" hint="Product lists and search show an inline error with retry." checked={prefs.failNext} onChange={(v) => setPrefs({ failNext: v })} />
      <Select label="Hide a home module (partial failure)" value={prefs.failModule ?? ""} onChange={(e) => setPrefs({ failModule: e.target.value || null })} fieldClassName="pt-3">
        <option value="">None — all modules load</option>
        {HOME_MODULES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
    </Group>
  );
}

function EventLog() {
  const events = useStore(eventsStore);
  const recent = [...events].reverse().slice(0, 8);
  return (
    <Group n={3} id="p-ev" title={<span>Event log <span className="font-normal text-ink-3">· PRD §8.1</span></span>}>
      <p className="mb-3 text-[12.5px] text-ink-3">Analytics events are logged locally — nothing is sent anywhere.</p>
      {recent.length === 0 ? (
        <p className="text-[13px] text-ink-3">No events yet. Browse, save or add something.</p>
      ) : (
        <ol className="divide-y divide-line border-y border-line text-[12px] leading-snug">
          {recent.map((e) => (
            <li key={e.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 py-2">
              <span className="tabular-nums text-ink-3">{fmtDateTime(e.at).split(", ").pop()}</span>
              <span className="min-w-0 break-words">
                <span className="font-semibold text-ink">{e.name}</span>{" "}
                <span className="tabular-nums text-ink-3">
                  {Object.entries(e.props)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" ")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Group>
  );
}

function DataSection() {
  const [confirm, setConfirm] = useState(false);
  return (
    <Group n={4} id="p-data" title="Data" className="space-y-3">
      <Button variant="secondary" size="sm" onClick={() => (accountStore.set((s) => ({ ...s, sessionUserId: "u-demo" })), toast({ title: "Signed in as the demo account", description: "Aarohi Mehta · seeded addresses and orders" }))}>
        Sign in as demo account
      </Button>
      <div>
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <span className="text-[13px] text-ink-2">Clear bag, wishlist, account and signals?</span>
            <Button variant="danger" size="sm" onClick={() => (resetAllStores(), setConfirm(false), toast({ title: "Prototype reset", description: "All local data cleared." }))}>
              Yes, reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" size="sm" icon={<RotateCcw size={13} />} onClick={() => setConfirm(true)}>
            Reset all data
          </Button>
        )}
      </div>
    </Group>
  );
}
