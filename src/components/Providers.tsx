"use client";
import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { track } from "@/lib/track";
import { dealStore, intentStore, resolveMode, signal } from "@/stores/intent";
import { useStore } from "@/lib/store";

/** Tracks arrival-with-deal-intent (e.g. a sale link) and logs adaptive-mode changes. */
function IntentWatcher() {
  const intent = useStore(intentStore);
  const deal = useStore(dealStore);
  const mode = resolveMode(intent, deal);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("ref") === "sale" || sp.get("intent") === "deal" || (sp.get("utm_campaign") ?? "").includes("sale")) signal("arrive_deal");
  }, []);

  useEffect(() => {
    track("intent_signal_change", { mode, override: intent.override, events: intent.events });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <IntentWatcher />
      {children}
    </MotionConfig>
  );
}
