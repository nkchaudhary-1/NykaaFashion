"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { setLaunchOffset } from "@/components/launch/clock";
import { resetNotify } from "@/components/launch/notify";
import { Button } from "@/components/ui/Button";
import { LayoutSwitch } from "@/components/layout/LayoutSwitch";
import { Select, Switch } from "@/components/ui/Form";
import { Overlay, OverlayBody, OverlayFooter, OverlayHeader } from "@/components/ui/Overlay";
import { SimulatedTag } from "@/components/ui/Simulated";
import { categoryById } from "@/data/categories";
import { editById } from "@/data/edits";
import { labelById } from "@/data/labels";
import { promos } from "@/data/promos";
import { HOME_MODULES, MODE_COPY, composeHome } from "@/lib/home";
import { DEFAULT_LAYOUT, HOME_LAYOUTS, useHomeLayout } from "@/lib/layout";
import { KIND_LABEL } from "@/lib/promo";
import { fmtDateTime } from "@/lib/format";
import { resetAllStores, useStore } from "@/lib/store";
import { eventsStore } from "@/lib/track";
import { accountStore } from "@/stores/account";
import { promoStore, resetPromos, showPromoNow } from "@/stores/promo";
import { INTENT_INITIAL, dealStore, intentStore, setIntentOverride, topKey, useIntent, type IntentOverride } from "@/stores/intent";
import { setPrefs, setUI, toast, usePrefs, useUI } from "@/stores/ui";
import { cn } from "@/lib/cn";

/**
 * The review controls as a flat drawer on the right: six numbered groups separated by ink rules — session intent, home layout, simulated
 * failure states, pop-ups, the analytics log, local data. Opens from the footer, the phone menu or the /prototype page (there is no floating button).
 */
export function PrototypePanel() {
  const { protoOpen } = useUI();
  return (
    <Overlay open={protoOpen} onClose={() => setUI({ protoOpen: false })} label="Prototype controls" side="right">
      <OverlayHeader title="Prototype controls" sub="Review simulated behaviour — nothing leaves this browser." />
      <OverlayBody flush>
        <IntentSection />
        <LayoutSection />
        <SimulateSection />
        <PromoSection />
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
  const layout = useHomeLayout();
  const W = intent.weights;
  const cat = topKey(W.category);
  const lab = topKey(W.label);
  const ed = topKey(W.edit);
  const opts: Array<{ id: IntentOverride; name: string }> = [{ id: "auto", name: "Auto (from signals)" }, { id: "cold", name: "Cold start" }, { id: "returning", name: "Returning" }, { id: "deal", name: "Deal intent" }];
  // What the home page is doing right now: the top of the module order for this mode (minus a module you chose to hide below).
  // The first few positions are where the modes differ, so that is what is shown.
  const order = composeHome(mode, layout).filter((s) => s.id !== failModule);
  const TOP = 6;
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
        <p className="eyebrow mb-2 text-ink-3">Top of the homepage now</p>
        <ol aria-label="Homepage module order" className="flex flex-wrap gap-1.5 text-[12px]">
          {order.slice(0, TOP).map((s, i) => (
            <li key={s.id} className={cn("inline-flex h-7 items-center gap-1.5 border px-2", i === 0 ? "border-ink bg-ink text-bone" : "border-line-strong text-ink-2", s.promoted && "border-pink-ink")}>
              <span className="tabular-nums opacity-70">{i + 1}</span>
              {HOME_MODULES.find((m) => m.id === s.id)?.name}
            </li>
          ))}
          {order.length > TOP && <li className="inline-flex h-7 items-center px-1 tabular-nums text-ink-3">+{order.length - TOP} more</li>}
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

function LayoutSection() {
  const layout = useHomeLayout();
  const { homeLayout } = usePrefs();
  const info = HOME_LAYOUTS.find((l) => l.id === layout)!;
  return (
    <Group n={2} id="p-layout" title="Home layout" className="space-y-4">
      <LayoutSwitch size="md" className="w-full" />
      <p className="border-l-2 border-ink pl-3 text-[13px] text-ink-2">
        <strong className="font-semibold text-ink">{info.name}</strong> — {info.blurb}
      </p>
      <p className="text-[12.5px] leading-relaxed text-ink-3">
        Only the home page changes. {homeLayout === null ? `Following this build’s default (${HOME_LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT)!.name}).` : "Chosen here; “Reset all data” returns to the build’s default."} A link can carry the choice: add <code>?layout=bleed</code> or <code>?layout=classic</code> to the home address.
      </p>
    </Group>
  );
}

function SimulateSection() {
  const prefs = usePrefs();
  return (
    <Group n={3} id="p-sim" title="Simulate states" className="space-y-1">
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

function PromoSection() {
  const memory = useStore(promoStore);
  const [id, setId] = useState(promos[0].id);
  const dismissed = Object.keys(memory.dismissed).length;
  return (
    <Group n={4} id="p-promo" title="Pop-ups" aside={<SimulatedTag note="Sample campaigns. What was dismissed or opened is remembered in this browser only." />} className="space-y-4">
      <p className="text-[12.5px] leading-relaxed text-ink-3">
        Small floating promotions — a picture or a muted video — appear a few seconds into browsing pages, never on bag, checkout, login or account. Closing one keeps it away for 7 days and quiets the rest for a day.
      </p>
      <Select label="Show a campaign now" value={id} onChange={(e) => setId(e.target.value)}>
        {promos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id} · {KIND_LABEL[c.kind].toLowerCase()} · {c.media.type}
          </option>
        ))}
      </Select>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => (showPromoNow(id), setUI({ protoOpen: false }))}>
          Show now
        </Button>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={() => (resetPromos(), toast({ title: "Pop-ups reset", description: "Dismissals cleared; they can appear again." }))}>
          Bring them all back
        </Button>
        <span className="text-[12.5px] tabular-nums text-ink-3">{dismissed ? `${dismissed} dismissed here` : "None dismissed yet"}</span>
      </div>
    </Group>
  );
}

function EventLog() {
  const events = useStore(eventsStore);
  const recent = [...events].reverse().slice(0, 8);
  return (
    <Group n={5} id="p-ev" title={<span>Event log <span className="font-normal text-ink-3">· PRD §8.1</span></span>}>
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
    <Group n={6} id="p-data" title="Data" className="space-y-3">
      <Button variant="secondary" size="sm" onClick={() => (accountStore.set((s) => ({ ...s, sessionUserId: "u-demo" })), toast({ title: "Signed in as the demo account", description: "Aarohi Mehta · seeded addresses and orders" }))}>
        Sign in as demo account
      </Button>
      <div>
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <span className="text-[13px] text-ink-2">Clear bag, wishlist, account, signals, pop-ups, reminders and the launch clock?</span>
            <Button variant="danger" size="sm" onClick={() => (resetAllStores(), resetNotify(), setLaunchOffset(0), setConfirm(false), toast({ title: "Prototype reset", description: "All local data cleared — bag, wishlist, account, signals, pop-ups, launch reminders and the launch clock." }))}>
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
