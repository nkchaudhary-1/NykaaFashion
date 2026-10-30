"use client";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { prefsStore, toast, usePrefs } from "@/stores/ui";

export function NewsletterForm({ className }: { className?: string }) {
  const { newsletter } = usePrefs();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const spacing = className ?? "mt-8";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    prefsStore.set((p) => ({ ...p, newsletter: email.trim() }));
    toast({ title: "You’re on the list", description: "Simulated — nothing was sent. Stored on this device only." });
    setEmail("");
    setError(null);
  };
  if (newsletter) {
    return (
      <p className={cn("flex items-center gap-2 text-[14px] text-ink-2", spacing)}>
        <Check size={16} className="text-emerald" aria-hidden /> Subscribed as {newsletter} (simulated)
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate className={cn("max-w-sm", spacing)}>
      <label htmlFor="nl" className="mb-3 block text-[13px] font-semibold text-ink">
        The Style Files letter
      </label>
      <div className="flex rounded-t-[var(--radius-sm)] border-b-2 border-line-strong bg-white transition-colors focus-within:border-pink">
        <input id="nl" type="email" autoComplete="email" placeholder="Your email" value={email} onChange={(e) => (setEmail(e.target.value), setError(null))} aria-invalid={error ? true : undefined} aria-describedby={error ? "nl-err" : undefined} className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none" />
        <button type="submit" aria-label="Subscribe" className="inline-flex size-12 items-center justify-center rounded-tr-[var(--radius-sm)] bg-navy text-white transition-colors hover:bg-ink">
          <ArrowRight size={19} />
        </button>
      </div>
      {error && (
        <p id="nl-err" role="alert" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
