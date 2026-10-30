"use client";
import { Check, ChevronDown } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full border bg-white text-[15px] text-ink placeholder:text-ink-3/80 transition-colors duration-200 hover:border-ink-3 focus:border-ink focus-visible:outline-offset-0 disabled:bg-sand disabled:text-ink-3";

export function FieldShell({ id, label, hint, error, optional, children, className }: { id: string; label?: string; hint?: string; error?: string | null; optional?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn("block", className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[12.5px] font-medium text-ink">
          <span>{label}</span>
          {optional && <span className="text-[11.5px] font-normal text-ink-3">Optional</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-ink-3">
          {hint}
        </p>
      )}
      <p id={`${id}-err`} role={error ? "alert" : undefined} className={cn("text-[12.5px] font-medium text-danger", error ? "mt-1.5" : "hidden")}>
        {error}
      </p>
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "id"> & { id?: string; label?: string; hint?: string; error?: string | null; optional?: boolean; prefix?: ReactNode; fieldClassName?: string };

export function Input({ id, label, hint, error, optional, prefix, className, fieldClassName, ...rest }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] text-ink-2">{prefix}</span>}
        <input
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
          className={cn(CONTROL, "h-12 px-4", error ? "border-danger" : "border-line-strong", prefix && "pl-14", className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
}

export function Textarea({ id, label, hint, error, optional, className, fieldClassName, ...rest }: Omit<ComponentProps<"textarea">, "id"> & { id?: string; label?: string; hint?: string; error?: string | null; optional?: boolean; fieldClassName?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <textarea id={fid} aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined} className={cn(CONTROL, "min-h-28 resize-y px-4 py-3", error ? "border-danger" : "border-line-strong", className)} {...rest} />
    </FieldShell>
  );
}

export function Select({ id, label, hint, error, optional, className, fieldClassName, children, ...rest }: Omit<ComponentProps<"select">, "id"> & { id?: string; label?: string; hint?: string; error?: string | null; optional?: boolean; fieldClassName?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <div className="relative">
        <select id={fid} aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-err` : undefined} className={cn(CONTROL, "h-12 appearance-none px-4 pr-10", error ? "border-danger" : "border-line-strong", className)} {...rest}>
          {children}
        </select>
        <ChevronDown aria-hidden size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" />
      </div>
    </FieldShell>
  );
}

/** Checkbox row with a visible custom box. */
export function Checkbox({ checked, onChange, label, count, disabled, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; count?: number; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("group flex min-h-9 cursor-pointer items-center gap-3 py-1 text-[14px] text-ink", disabled && "cursor-not-allowed opacity-45", className)}>
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className="inline-flex size-[18px] shrink-0 items-center justify-center border border-ink-3 bg-white text-bone transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink group-hover:border-ink">
        <Check size={13} strokeWidth={3} className={cn("transition-opacity", checked ? "opacity-100" : "opacity-0")} />
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[12px] tabular-nums text-ink-3">{count}</span>}
    </label>
  );
}

export function Radio({ checked, onChange, name, label, sub, right, className, value }: { checked: boolean; onChange: () => void; name: string; label: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string; value?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("group relative flex cursor-pointer items-start gap-3.5 border bg-white p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink", checked ? "border-ink" : "border-line-strong hover:border-ink-3", className)}>
      <input id={id} type="radio" name={name} value={value} className="peer sr-only" checked={checked} onChange={onChange} />
      <span aria-hidden className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-ink-3 bg-white peer-checked:border-ink">
        <span className={cn("size-2.5 rounded-full bg-ink transition-transform duration-200", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium text-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-[13px] text-ink-3">{sub}</span>}
      </span>
      {right && <span className="shrink-0 text-[14px] tabular-nums text-ink">{right}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, hint, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4 py-1.5", className)}>
      <div className="min-w-0">
        <span id={`${id}-l`} className="block text-[14px] text-ink">
          {label}
        </span>
        {hint && <span className="block text-[12.5px] text-ink-3">{hint}</span>}
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-l`} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 transition-colors duration-300", checked ? "bg-ink" : "bg-line-strong")}>
        <span className={cn("absolute left-0.5 top-0.5 size-5 bg-white transition-transform duration-300 ease-editorial", checked && "translate-x-5")} />
      </button>
    </div>
  );
}
