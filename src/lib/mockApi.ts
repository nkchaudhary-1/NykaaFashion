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
  const [state, setState] = useState<{ status: QueryStatus; data: T | undefined; key: string | null }>({ status: "loading", data: undefined, key: null });
  const [attempt, setAttempt] = useState(0);
  const computeRef = useRef(compute);
  useEffect(() => {
    computeRef.current = compute;
  });

  useEffect(() => {
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
