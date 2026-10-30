"use client";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { prefsStore, toast, usePrefs } from "@/stores/ui";

export function NewsletterForm() {
  const { newsletter } = usePrefs();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      <p className="mt-8 flex items-center gap-2 text-[14px] text-bone/80">
        <Check size={16} className="text-gold" aria-hidden /> Subscribed as {newsletter} (simulated)
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-sm">
      <label htmlFor="nl" className="eyebrow mb-3 block text-bone/55">
        The Style Files letter
      </label>
      <div className="flex border-b border-bone/40 transition-colors focus-within:border-bone focus-within:border-b-2">
        <input id="nl" type="email" autoComplete="email" placeholder="Your email" value={email} onChange={(e) => (setEmail(e.target.value), setError(null))} aria-invalid={error ? true : undefined} aria-describedby={error ? "nl-err" : undefined} className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-bone placeholder:text-bone/45 focus:outline-none" />
        <button type="submit" aria-label="Subscribe" className="inline-flex size-12 items-center justify-center text-bone transition-transform hover:translate-x-0.5">
          <ArrowRight size={19} />
        </button>
      </div>
      {error && (
        <p id="nl-err" role="alert" className="mt-2 text-[12.5px] text-[#ffb4a8]">
          {error}
        </p>
      )}
    </form>
  );
}
