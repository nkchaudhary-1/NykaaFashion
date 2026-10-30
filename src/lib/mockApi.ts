"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { prefsStore, setPrefs } from "@/stores/ui";

export type QueryStatus = "loading" | "ready" | "error";

/**
 * Simulated async data source. Gives every surface real loading / error / retry states (PRD §7.5)
 * without a backend. `key` changes re-run the query; the previous data stays visible while reloading.
 * The Prototype panel can add latency or force the next request to fail.
 */
export function useMockQuery<T>(key: string, compute: () => T, delay = 380) {
  // The first paint of a page needs no pretend round-trip — the route's own skeleton already covered the load, and holding
  // results back would only delay the LCP. The delay is for *changes* (filters, sort), retries, and the Prototype
  // panel's slow / failing network demos, which still start from a skeleton.
  const [state, setState] = useState<{ status: QueryStatus; data: T | undefined; key: string | null }>(() => {
    const p = prefsStore.get();
    return p.slowNetwork || p.failNext ? { status: "loading", data: undefined, key: null } : { status: "ready", data: compute(), key };
  });
  const [attempt, setAttempt] = useState(0);
  const computeRef = useRef(compute);
  const settled = useRef(state.key); // the key whose data is already in state from the first render
  useEffect(() => {
    computeRef.current = compute;
  });

  useEffect(() => {
    if (settled.current === key && attempt === 0) return;
    settled.current = null;
    const prefs = prefsStore.get();
    const wait = prefs.slowNetwork ? delay + 1400 : delay;
    const t = setTimeout(() => {
      if (prefsStore.get().failNext) {
        setPrefs({ failNext: false });
        setState((s) => ({ status: "error", data: s.data, key }));
        return;
      }
      setState({ status: "ready", data: computeRef.current(), key });
    }, wait);
    return () => clearTimeout(t);
  }, [key, attempt, delay]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: "loading" }));
    setAttempt((a) => a + 1);
  }, []);

  const pending = state.key !== key && state.status !== "error";
  return { status: state.status, data: state.data, retry, reloading: state.status === "ready" && pending };
}
