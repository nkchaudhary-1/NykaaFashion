import { productById } from "@/data/catalog";
import { DAY, EPOCH, nowMs } from "@/lib/clock";
import { buildOrder, newOrderNumber, nextStatus, STATUS_NOTE, toOrderItems } from "@/lib/orders";
import { priceBag, type Breakdown } from "@/lib/pricing";
import { createStore, useHydrated, useStore } from "@/lib/store";

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender?: string;
  dob?: string;
  createdAt: number;
}
export interface Address {
  id: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  type: "home" | "work" | "other";
  isDefault: boolean;
}
export type PayMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";
export type OrderStatus = "created" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "return-requested" | "refunded";
export interface OrderItem {
  productId: string;
  variant: number;
  size: string;
  qty: number;
  price: number;
  mrp: number;
  name: string;
  label: string;
  image: string;
  color: string;
}
export interface Order {
  id: string;
  number: string;
  userId: string;
  placedAt: number;
  items: OrderItem[];
  address: Address;
  payment: { method: PayMethod; detail: string };
  delivery: "standard" | "express";
  coupon: string | null;
  pricing: Breakdown;
  status: OrderStatus;
  timeline: Array<{ status: OrderStatus; at: number; note: string }>;
  eta: number;
  returnReason?: string;
  simulated: true;
}
interface UserRecord {
  user: User;
  addresses: Address[];
  orders: Order[];
}
export interface AccountState {
  users: Record<string, UserRecord>;
  sessionUserId: string | null;
  otp: { target: string; code: string; sentAt: number } | null;
}

export const DEMO_MOBILE = "9876543210";
export const PROTOTYPE_OTP = "123456";

// ── Seed: a demo account so Account / Orders / Tracking can be reviewed without placing an order ──
function seed(): AccountState {
  const user: User = { id: "u-demo", name: "Aarohi Mehta", email: "aarohi.mehta@example.com", mobile: DEMO_MOBILE, gender: "Female", createdAt: EPOCH - 400 * DAY };
  const home: Address = { id: "a-home", name: "Aarohi Mehta", mobile: DEMO_MOBILE, line1: "14, Sunrise Residency, Linking Road", line2: "Bandra West", landmark: "Near Elco Market", pincode: "400050", city: "Mumbai", state: "Maharashtra", type: "home", isDefault: true };
  const work: Address = { id: "a-work", name: "Aarohi Mehta", mobile: DEMO_MOBILE, line1: "Floor 7, Orchid Tech Park, Outer Ring Road", landmark: "Opp. Marathahalli Bridge", pincode: "560034", city: "Bengaluru", state: "Karnataka", type: "work", isDefault: false };
  const mk = (id: string, number: string, daysAgo: number, picks: Array<[string, number, string, number]>, payment: Order["payment"], status: OrderStatus, delivery: "standard" | "express" = "standard") => {
    const lines = picks.flatMap(([pid, v, size, qty]) => {
      const product = productById[pid];
      return product ? [{ id: `${pid}:${v}:${size}`, productId: pid, variant: v, size, qty, addedAt: 0, product, variantData: product.variants[v], stock: 9 }] : [];
    });
    const items = toOrderItems(lines);
    const pricing = priceBag(lines, { delivery, cod: payment.method === "cod" });
    return buildOrder({ id, number, userId: user.id, placedAt: EPOCH - daysAgo * DAY, items, address: home, payment, delivery, coupon: null, status }, pricing);
  };
  const orders = [
    mk("nf-26100412", "NF-2610-0412", 1.2, [["mit-01", 0, "One size", 1], ["hea-01", 0, "One size", 1]], { method: "cod", detail: "Cash on delivery" }, "packed"),
    mk("nf-26100377", "NF-2610-0377", 3.5, [["aja-01", 0, "S", 1], ["saa-04", 0, "One size", 1]], { method: "card", detail: "Visa •••• 4242" }, "shipped"),
    mk("nf-26091985", "NF-2609-1985", 24, [["lik-02", 0, "M", 1], ["pip-01", 0, "One size", 1]], { method: "upi", detail: "aarohi@okbank" }, "delivered"),
  ];
  return { users: { [user.id]: { user, addresses: [home, work], orders } }, sessionUserId: null, otp: null };
}

export const accountStore = createStore<AccountState>("nf.account", seed(), { version: 1 });

// ── Selectors / hooks ────────────────────────────────────────
export function useAuth() {
  const state = useStore(accountStore);
  const ready = useHydrated();
  const rec = state.sessionUserId ? state.users[state.sessionUserId] : undefined;
  return { ready, user: rec?.user ?? null, addresses: rec?.addresses ?? [], orders: rec?.orders ?? [], otp: state.otp };
}
export const currentUserId = () => accountStore.get().sessionUserId;

const patchUser = (fn: (r: UserRecord) => UserRecord) =>
  accountStore.set((s) => {
    const id = s.sessionUserId;
    if (!id || !s.users[id]) return s;
    return { ...s, users: { ...s.users, [id]: fn(s.users[id]) } };
  });

// ── Auth (simulated OTP — no SMS or email is sent) ───────────
const isMobile = (v: string) => /^[6-9]\d{9}$/.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function normaliseTarget(raw: string): string {
  const v = raw.trim().replace(/[\s-]/g, "").replace(/^\+?91/, "");
  return /^\d+$/.test(v) ? v : raw.trim().toLowerCase();
}
export function validateTarget(raw: string): string | null {
  const v = normaliseTarget(raw);
  if (!v) return "Enter your mobile number or email.";
  if (/^\d+$/.test(v)) return isMobile(v) ? null : "Enter a valid 10-digit Indian mobile number.";
  return isEmail(v) ? null : "Enter a valid email address.";
}

export function sendOtp(raw: string): { ok: true; target: string } | { ok: false; error: string } {
  const error = validateTarget(raw);
  if (error) return { ok: false, error };
  const target = normaliseTarget(raw);
  accountStore.set((s) => ({ ...s, otp: { target, code: PROTOTYPE_OTP, sentAt: nowMs() } }));
  return { ok: true, target };
}

const findUser = (s: AccountState, target: string) => Object.values(s.users).find((r) => r.user.mobile === target || r.user.email.toLowerCase() === target)?.user;

export function verifyOtp(code: string): { ok: true; status: "login" | "new" } | { ok: false; error: string } {
  const s = accountStore.get();
  if (!s.otp) return { ok: false, error: "Request a code first." };
  if (code.trim() !== s.otp.code) return { ok: false, error: `That code doesn’t match. In this prototype the code is ${PROTOTYPE_OTP}.` };
  const user = findUser(s, s.otp.target);
  if (user) {
    accountStore.set((p) => ({ ...p, sessionUserId: user.id, otp: null }));
    return { ok: true, status: "login" };
  }
  return { ok: true, status: "new" };
}

export function createAccount(input: { name: string; email: string; mobile: string }): { ok: true } | { ok: false; error: string } {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Enter your full name." };
  if (!isEmail(input.email.trim())) return { ok: false, error: "Enter a valid email address." };
  if (!isMobile(input.mobile)) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const id = `u-${nowMs().toString(36)}`;
  const user: User = { id, name, email: input.email.trim().toLowerCase(), mobile: input.mobile, createdAt: nowMs() };
  accountStore.set((s) => ({ ...s, users: { ...s.users, [id]: { user, addresses: [], orders: [] } }, sessionUserId: id, otp: null }));
  return { ok: true };
}
export const logout = () => accountStore.set((s) => ({ ...s, sessionUserId: null, otp: null }));

export function updateProfile(patch: Partial<Pick<User, "name" | "email" | "gender" | "dob">>) {
  patchUser((r) => ({ ...r, user: { ...r.user, ...patch } }));
}

// ── Addresses ────────────────────────────────────────────────
export function saveAddress(a: Omit<Address, "id" | "isDefault"> & { id?: string; isDefault?: boolean }): Address {
  const id = a.id ?? `a-${nowMs().toString(36)}`;
  let saved!: Address;
  patchUser((r) => {
    const makeDefault = a.isDefault || r.addresses.length === 0;
    saved = { ...a, id, isDefault: makeDefault };
    const others = r.addresses.filter((x) => x.id !== id).map((x) => (makeDefault ? { ...x, isDefault: false } : x));
    const existingIdx = r.addresses.findIndex((x) => x.id === id);
    const list = existingIdx >= 0 ? r.addresses.map((x) => (x.id === id ? saved : makeDefault ? { ...x, isDefault: false } : x)) : [saved, ...others];
    return { ...r, addresses: list };
  });
  return saved;
}
export function deleteAddress(id: string) {
  patchUser((r) => {
    const list = r.addresses.filter((a) => a.id !== id);
    if (list.length && !list.some((a) => a.isDefault)) list[0] = { ...list[0], isDefault: true };
    return { ...r, addresses: list };
  });
}
export const setDefaultAddress = (id: string) => patchUser((r) => ({ ...r, addresses: r.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }));

// ── Orders (simulated lifecycle) ─────────────────────────────
export function placeOrder(input: {
  lines: Parameters<typeof toOrderItems>[0];
  address: Address;
  payment: Order["payment"];
  delivery: "standard" | "express";
  coupon: string | null;
  pricing: Breakdown;
}): Order | null {
  const uid = currentUserId();
  if (!uid) return null;
  const now = nowMs();
  const { id, number } = newOrderNumber(now);
  const order = buildOrder({ id, number, userId: uid, placedAt: now, items: toOrderItems(input.lines), address: input.address, payment: input.payment, delivery: input.delivery, coupon: input.coupon, status: "created" }, input.pricing);
  patchUser((r) => ({ ...r, orders: [order, ...r.orders] }));
  return order;
}
const patchOrder = (id: string, fn: (o: Order) => Order) => patchUser((r) => ({ ...r, orders: r.orders.map((o) => (o.id === id ? fn(o) : o)) }));

export function advanceOrder(id: string) {
  patchOrder(id, (o) => {
    const next = nextStatus(o.status);
    if (!next) return o;
    return { ...o, status: next, timeline: [...o.timeline, { status: next, at: nowMs(), note: STATUS_NOTE[next] }] };
  });
}
export function cancelOrder(id: string) {
  patchOrder(id, (o) => ({ ...o, status: "cancelled", timeline: [...o.timeline, { status: "cancelled", at: nowMs(), note: STATUS_NOTE.cancelled }] }));
}
export function requestReturn(id: string, reason: string) {
  patchOrder(id, (o) => ({ ...o, status: "return-requested", returnReason: reason, timeline: [...o.timeline, { status: "return-requested", at: nowMs(), note: `${STATUS_NOTE["return-requested"]} Reason: ${reason}.` }] }));
}
