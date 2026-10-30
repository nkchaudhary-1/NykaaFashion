import { nowMs } from "@/lib/clock";
import { createStore, useStore } from "@/lib/store";
import { useAuth } from "@/stores/account";

/**
 * Saved payment methods — SIMULATED. Only a UPI handle, or a card's brand and last four digits, is ever kept (never a full number,
 * expiry or CVV), on this device only, per signed-in user. The demo account starts with the two methods its past orders used.
 */
export type SavedMethod = { id: string; kind: "upi"; upi: string; addedAt: number } | { id: string; kind: "card"; brand: string; last4: string; addedAt: number };
interface PaymentsState {
  byUser: Record<string, SavedMethod[]>;
}

const SEED: PaymentsState = {
  byUser: {
    "u-demo": [
      { id: "pm-upi-demo", kind: "upi", upi: "aarohi@okbank", addedAt: 0 },
      { id: "pm-card-demo", kind: "card", brand: "Visa", last4: "4242", addedAt: 0 },
    ],
  },
};

export const paymentsStore = createStore<PaymentsState>("nf.payments", SEED, { version: 1 });

const patch = (userId: string, fn: (list: SavedMethod[]) => SavedMethod[]) => paymentsStore.set((s) => ({ ...s, byUser: { ...s.byUser, [userId]: fn(s.byUser[userId] ?? []) } }));

export function addUpi(userId: string, upi: string) {
  const handle = upi.trim();
  patch(userId, (l) => (l.some((m) => m.kind === "upi" && m.upi.toLowerCase() === handle.toLowerCase()) ? l : [{ id: `pm-${nowMs().toString(36)}`, kind: "upi", upi: handle, addedAt: nowMs() }, ...l]));
}
export function addCard(userId: string, brand: string, last4: string) {
  patch(userId, (l) => (l.some((m) => m.kind === "card" && m.brand === brand && m.last4 === last4) ? l : [{ id: `pm-${nowMs().toString(36)}`, kind: "card", brand, last4, addedAt: nowMs() }, ...l]));
}
export const removeMethod = (userId: string, id: string) => patch(userId, (l) => l.filter((m) => m.id !== id));

/** The signed-in user's saved methods (empty when signed out). */
export function useSavedPayments() {
  const auth = useAuth();
  const state = useStore(paymentsStore);
  return { ...auth, methods: auth.user ? (state.byUser[auth.user.id] ?? []) : [] };
}
