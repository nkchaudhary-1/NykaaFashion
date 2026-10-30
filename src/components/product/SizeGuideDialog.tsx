"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { productById } from "@/data/catalog";
import { SIZE_GUIDES, sizeGuideKey, type SizeGuide } from "@/data/content";
import { cn } from "@/lib/cn";
import { setUI, useUI } from "@/stores/ui";

const num = (s: string) => {
  const parts = s.match(/[\d.]+/g);
  return parts ? parseFloat(parts[parts.length - 1]) : NaN;
};

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

export function SizeGuideHost() {
  const { sizeGuide } = useUI();
  const product = sizeGuide ? productById[sizeGuide.productId] : null;
  const key = product ? sizeGuideKey(product.categoryPath, product.sizes) : null;
  const guide = key ? SIZE_GUIDES[key] : null;
  return (
    <Overlay open={!!guide} onClose={() => setUI({ sizeGuide: null })} label="Size guide" side="center" panelClassName="sm:w-[min(94vw,640px)] sm:max-h-[90dvh]">
      {guide && product && (
        <>
          <OverlayHeader title="Size guide" sub={guide.title} />
          <OverlayBody>
            <GuideContent key={guide.id} guide={guide} fitNote={product.fit} modelNote={product.modelNote} />
          </OverlayBody>
        </>
      )}
    </Overlay>
  );
}

function GuideContent({ guide, fitNote, modelNote }: { guide: SizeGuide; fitNote: string; modelNote?: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const rec = useMemo(() => recommend(guide, values), [guide, values]);
  return (
    <div className="space-y-7">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse text-left text-[14px] tabular-nums">
          <caption className="sr-only">{guide.title} — measurements in {guide.unit}</caption>
          <thead>
            <tr className="border-b border-ink">
              {guide.columns.map((c, i) => (
                <th key={c} scope="col" className={cn("py-2.5 pr-4 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3", i > 0 && "text-right")}>
                  {c}
                  {i > 0 && <span className="ml-1 normal-case tracking-normal">({guide.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((r) => (
              <tr key={r[0]} className={cn("border-b border-line", rec?.size === r[0] && "bg-pink-tint")}>
                {r.map((cell, i) => (
                  <td key={i} className={cn("py-2.5 pr-4", i === 0 ? "font-medium text-ink" : "text-right text-ink-2")}>
                    {cell}
                    {i === 0 && rec?.size === r[0] && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-pink-ink">Your size</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-ink-3">{guide.note}</p>

      {guide.measure && (
        <section aria-labelledby="fms" className="border border-line bg-white p-5">
          <h3 id="fms" className="text-[14px] font-medium">
            Find my size
          </h3>
          <div className={cn("mt-4 grid gap-3", guide.measure.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
            {guide.measure.map((m) => (
              <Input key={m.key} type="number" inputMode="decimal" min={20} max={220} label={`${m.label} (${guide.unit})`} hint={m.hint} value={values[m.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))} />
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
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setValues({})}>
              Clear
            </Button>
          )}
        </section>
      )}

      <div className="text-[13px] text-ink-2">
        <p>
          <span className="font-medium text-ink">This piece:</span> {fitNote}.
        </p>
        {modelNote && <p className="mt-1">{modelNote}.</p>}
      </div>
    </div>
  );
}
