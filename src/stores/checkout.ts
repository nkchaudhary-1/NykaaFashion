import type { PayMethod } from "@/stores/account";
import { createStore, useStore } from "@/lib/store";

// Only non-sensitive choices are kept (session-scoped). Card details live in component state and are never stored.
export interface CheckoutState {
  step: 0 | 1 | 2;
  addressId: string | null;
  delivery: "standard" | "express";
  method: PayMethod | null;
  bank: string;
  wallet: string;
}
export const CHECKOUT_INITIAL: CheckoutState = { step: 0, addressId: null, delivery: "standard", method: null, bank: "", wallet: "" };
export const checkoutStore = createStore<CheckoutState>("nf.checkout", CHECKOUT_INITIAL, { persist: "session" });
export const useCheckout = () => useStore(checkoutStore);
export const patchCheckout = (p: Partial<CheckoutState>) => checkoutStore.set((s) => ({ ...s, ...p }));
export const resetCheckout = () => checkoutStore.set(CHECKOUT_INITIAL);
