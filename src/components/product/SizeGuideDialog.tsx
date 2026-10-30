"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Form";
import { Img } from "@/components/ui/Img";
import { Overlay, OverlayBody } from "@/components/ui/Overlay";
import { productById } from "@/data/catalog";
import { SIZE_GUIDES, sizeGuideKey, type SizeGuide } from "@/data/content";
import { labelById } from "@/data/labels";
import type { Product } from "@/data/types";
import { cn } from "@/lib/cn";
import { createStore, useStore } from "@/lib/store";
import { setUI, useUI } from "@/stores/ui";

export type SizeUnit = "in" | "cm";
/** The unit the shopper reads measurements in — shared by the size chips' measurement row and this drawer. */
export const sizeUnitStore = createStore<SizeUnit>("nf.sizeUnit", "in");
/**
 * The drawer is hosted once for the whole app, so the size picker that opened it hands over its current size and a way to
 * set a size (radios in the table choose the size on the page behind).
 */
export const sizeGuideBridge = createStore<{ current: string | null; pick: ((size: string) => void) | null }>("nf.sizeGuideBridge", { current: null, pick: null }, { persist: false });

const CM_PER_IN = 2.54;
/** Size-guide values are authored in cm. Convert every number in a cell ("84", "92–98") to inches, to the nearest half. */
export function inUnit(value: string, unit: SizeUnit): string {
  if (unit === "cm") return value;
  return value.replace(/\d+(\.\d+)?/g, (m) => {
    const r = Math.round((parseFloat(m) / CM_PER_IN) * 2) / 2;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  });
}
/** "Size", "UK", "EU" columns are labels, not lengths. */
export const isLengthColumn = (col: string) => !/^(size|uk|eu|us)$/i.test(col.trim());

const num = (s: string) => {
  const parts = s.match(/[\d.]+/g);
  return parts ? parseFloat(parts[parts.length - 1]) : NaN;
};

/** `values` are in cm. */
function recommend(guide: SizeGuide, values: Record<string, string>): { size: string | null; beyond: boolean } | null {
  const entered = (guide.measure ?? []).filter((m) => values[m.key]);
  if (!entered.length) return null;
  for (const row of guide.rows) {
    const ok = entered.every((m) => {
      const col = guide.columns.findIndex((c) => c.toLowerCase() === m.label.toLowerCase());
      return col >= 0 && num(row[col]) >= parseFloat(values[m.key]);
    });
    if (ok) return { size: row[0], beyond: false };
  }
  return { size: guide.rows[guide.rows.length - 1][0], beyond: true };
}

/** Right-hand drawer: product + title, the measurement table (radios choose the size on the page), an in | cm pill toggle, find-my-size. */
export function SizeGuideHost() {
  const { sizeGuide } = useUI();
  const product = sizeGuide ? productById[sizeGuide.productId] : null;
  const key = product ? sizeGuideKey(product.categoryPath, product.sizes) : null;
  const guide = key ? SIZE_GUIDES[key] : null;
  return (
    <Overlay open={!!guide} onClose={() => setUI({ sizeGuide: null })} label="Size guide" side="right" panelClassName="sm:w-[min(100vw,540px)]">
      {guide && product && <GuideContent key={`${guide.id}-${product.id}`} guide={guide} product={product} />}
    </Overlay>
  );
}

function GuideContent({ guide, product }: { guide: SizeGuide; product: Product }) {
  const unit = useStore(sizeUnitStore);
  const label = labelById[product.labelId];
  const [values, setValues] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(() => sizeGuideBridge.get().current);
  const [how, setHow] = useState(false);

  // find-my-size inputs are read in the unit on screen; the table and the maths stay in cm
  const cmValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      const n = parseFloat(v);
      if (v !== "" && !Number.isNaN(n)) out[k] = String(unit === "in" ? n * CM_PER_IN : n);
    }
    return out;
  }, [values, unit]);
  const rec = useMemo(() => recommend(guide, cmValues), [guide, cmValues]);

  const choose = (size: string) => {
    setPicked(size);
    sizeGuideBridge.set((b) => ({ ...b, current: size }));
    sizeGuideBridge.get().pick?.(size);
  };
  const unitLabel = (c: string, i: number) => (i > 0 && isLengthColumn(c) ? `${c} (${unit})` : c);

  return (
    <>
      {/* a div, not <header>: inside a dialog a <header> would count as a second banner landmark */}
      <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pr-16">
        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">Size Guide</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 shrink-0">
            <Img imgKey={product.variants[0].images[0]} alt="" sizes="48px" ratio="4/5" />
          </div>
          <p className="min-w-0 truncate text-[13.5px] leading-snug text-ink-3">
            <span className="font-semibold text-ink">{label.name}</span> • {product.name}
          </p>
        </div>
      </div>

      <OverlayBody className="relative">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[34ch] text-[14px] leading-snug text-ink-2">{guide.note}</p>
          <button type="button" onClick={() => setHow((h) => !h)} aria-expanded={how} className="link-u tap shrink-0 text-[14px] font-semibold text-pink hover:text-pink-ink">
            How to Measure
          </button>
        </div>
        {how && guide.measure && (
          <ul className="mt-4 space-y-1.5 bg-sand p-4 text-[13px] leading-snug text-ink-2">
            {guide.measure.map((m) => (
              <li key={m.key}>
                <span className="font-semibold text-ink">{m.label}.</span> {m.hint.replace(/\bcm\b/gi, unit)}.
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[340px] border-collapse text-left text-[14px] tabular-nums">
            <caption className="sr-only">
              {guide.title} — measurements in {unit === "in" ? "inches" : "centimetres"}
            </caption>
            <thead>
              <tr className="bg-sand">
                {guide.columns.map((c, i) => (
                  <th key={c} scope="col" className={cn("px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2", i === 0 && "rounded-l-[var(--radius-md)] pl-10", i === guide.columns.length - 1 && "rounded-r-[var(--radius-md)]")}>
                    {unitLabel(c, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((r, ri) => {
                const available = product.sizes.includes(r[0]);
                const isRec = rec?.size === r[0];
                return (
                  <tr key={r[0]} className={cn(ri % 2 === 1 && "bg-paper", isRec && "bg-pink-tint", !available && "text-ink-3")}>
                    {r.map((cell, i) =>
                      i === 0 ? (
                        <td key={i} className="rounded-l-[var(--radius-md)] py-3 pl-3 pr-3">
                          <label className={cn("flex items-center gap-3", available ? "cursor-pointer" : "cursor-not-allowed")}>
                            <input type="radio" name="guide-size" value={r[0]} checked={picked === r[0]} disabled={!available} onChange={() => choose(r[0])} className="peer sr-only" />
                            <span aria-hidden className="relative inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-white peer-checked:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-checked:[&>span]:scale-100">
                              <span className="size-2.5 scale-0 rounded-full bg-ink transition-transform duration-200" />
                            </span>
                            <span className="font-semibold text-ink">{cell}</span>
                            {isRec && <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-ink">Your size</span>}
                            {!available && <span className="text-[11px] uppercase tracking-wider">Not offered</span>}
                          </label>
                        </td>
                      ) : (
                        <td key={i} className={cn("px-3 py-3 text-ink-2", i === r.length - 1 && "rounded-r-[var(--radius-md)]")}>
                          {isLengthColumn(guide.columns[i]) ? inUnit(cell, unit) : cell}
                        </td>
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* in | cm: a pill pair that rides the bottom edge of the scrolling drawer */}
        <div className="sticky bottom-0 z-10 mt-5 flex justify-end pb-1">
          <div role="group" aria-label="Measurement unit" className="inline-flex rounded-full border border-pink bg-white p-0.5">
            {(["in", "cm"] as const).map((u) => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => sizeUnitStore.set(u)} className={cn("h-9 min-w-14 rounded-full px-4 text-[14px] font-semibold transition-colors [@media(pointer:coarse)]:h-11", unit === u ? "bg-pink text-white" : "text-pink hover:bg-pink-tint")}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {guide.measure && (
          <section aria-labelledby="fms" className="mt-6 border border-line bg-white p-5">
            <h3 id="fms" className="text-[15px] font-semibold">
              Find my size
            </h3>
            <div className={cn("mt-4 grid gap-3", guide.measure.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
              {guide.measure.map((m) => (
                <Input key={m.key} type="number" inputMode="decimal" min={unit === "in" ? 8 : 20} max={unit === "in" ? 90 : 220} label={`${m.label} (${unit})`} hint={m.hint.replace(/\bcm\b/gi, unit)} value={values[m.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))} />
              ))}
            </div>
            <div aria-live="polite" className="mt-4 min-h-6 text-[14px]">
              {rec ? (
                <p>
                  We suggest <strong className="font-semibold">{rec.size}</strong>.{rec.beyond && " Your measurement is at the top of our range — contact us for made-to-measure."} Between sizes? Size up for a relaxed fit.
                </p>
              ) : (
                <p className="text-ink-3">Enter one or more measurements for a suggestion.</p>
              )}
            </div>
            {Object.keys(values).length > 0 && (
              <button type="button" onClick={() => setValues({})} className="link-u tap mt-2 text-[13px] font-semibold text-pink hover:text-pink-ink">
                Clear
              </button>
            )}
          </section>
        )}

        <div className="mt-6 text-[13px] text-ink-2">
          <p>
            <span className="font-semibold text-ink">This piece:</span> {product.fit}.
          </p>
          {product.modelNote && <p className="mt-1">{product.modelNote}.</p>}
        </div>
      </OverlayBody>
    </>
  );
}
