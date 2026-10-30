import { cn } from "@/lib/cn";
import type { Product } from "@/data/types";

export function Swatch({ hex, selected, size = 22 }: { hex: string; selected?: boolean; size?: number }) {
  return (
    <span aria-hidden className={cn("inline-block rounded-full border border-ink/15", selected && "ring-1 ring-ink ring-offset-2 ring-offset-bone")} style={{ width: size, height: size, backgroundColor: hex }} />
  );
}

/** Interactive colour picker for PDP / quick view. */
export function ColorPicker({ product, value, onChange }: { product: Product; value: number; onChange: (i: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-[13px] text-ink-2">
        Colour: <span className="font-medium text-ink">{product.variants[value].colorName}</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {product.variants.map((v, i) => (
          <label key={v.id} className="relative inline-flex size-11 cursor-pointer items-center justify-center">
            <input type="radio" name={`color-${product.id}`} className="peer sr-only" checked={value === i} onChange={() => onChange(i)} aria-label={v.colorName} />
            <Swatch hex={v.colorHex} selected={value === i} size={28} />
            <span aria-hidden className="absolute inset-0 rounded-full outline-offset-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Small static swatch row for cards. */
export function SwatchRow({ product, max = 4 }: { product: Product; max?: number }) {
  if (product.variants.length < 2) return null;
  const shown = product.variants.slice(0, max);
  return (
    <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.variants.length} colours`}>
      {shown.map((v) => (
        <Swatch key={v.id} hex={v.colorHex} size={11} />
      ))}
      {product.variants.length > max && <span className="text-[11px] text-ink-3">+{product.variants.length - max}</span>}
    </div>
  );
}
