import type { Coupon } from "./types.ts";

// All coupon, shipping and serviceability rules are SIMULATED prototype logic.

export const coupons: Coupon[] = [
  { code: "TASTE10", title: "10% off your edit", description: "10% off orders above ₹1,499 — up to ₹500.", type: "percent", value: 10, maxDiscount: 500, minSubtotal: 1499 },
  { code: "FIRSTEDIT", title: "₹300 off your first order", description: "Flat ₹300 off orders above ₹1,999.", type: "flat", value: 300, minSubtotal: 1999 },
  { code: "GEMS15", title: "15% off Hidden Gems", description: "15% off Hidden Gems pieces — up to ₹1,000.", type: "percent", value: 15, maxDiscount: 1000, minSubtotal: 0, appliesTo: "hiddenGem" },
  { code: "HOUSE200", title: "₹200 off House of Nykaa", description: "Flat ₹200 off House of Nykaa pieces above ₹999.", type: "flat", value: 200, minSubtotal: 999, appliesTo: "houseOfNykaa" },
  { code: "OLDSALE", title: "Monsoon markdown", description: "Expired offer — kept to demonstrate the expired state.", type: "percent", value: 20, minSubtotal: 0, expired: true },
];
export const couponByCode: Record<string, Coupon> = Object.fromEntries(coupons.map((c) => [c.code, c]));

export const FREE_SHIPPING_THRESHOLD = 1999;
export const STANDARD_SHIPPING = 99;
export const EXPRESS_SHIPPING = 199;
export const COD_FEE = 49;

export interface ServiceArea {
  city: string;
  state: string;
  days: number;
  cod: boolean;
}

const KNOWN: Record<string, ServiceArea> = {
  "110001": { city: "New Delhi", state: "Delhi", days: 2, cod: true },
  "122001": { city: "Gurugram", state: "Haryana", days: 2, cod: true },
  "201301": { city: "Noida", state: "Uttar Pradesh", days: 3, cod: true },
  "226001": { city: "Lucknow", state: "Uttar Pradesh", days: 4, cod: true },
  "302001": { city: "Jaipur", state: "Rajasthan", days: 3, cod: true },
  "380001": { city: "Ahmedabad", state: "Gujarat", days: 3, cod: true },
  "400001": { city: "Mumbai", state: "Maharashtra", days: 2, cod: true },
  "400050": { city: "Mumbai", state: "Maharashtra", days: 2, cod: true },
  "411001": { city: "Pune", state: "Maharashtra", days: 3, cod: true },
  "500001": { city: "Hyderabad", state: "Telangana", days: 3, cod: true },
  "560001": { city: "Bengaluru", state: "Karnataka", days: 2, cod: true },
  "560034": { city: "Bengaluru", state: "Karnataka", days: 2, cod: true },
  "600001": { city: "Chennai", state: "Tamil Nadu", days: 3, cod: true },
  "682001": { city: "Kochi", state: "Kerala", days: 4, cod: true },
  "700001": { city: "Kolkata", state: "West Bengal", days: 4, cod: true },
  "781001": { city: "Guwahati", state: "Assam", days: 6, cod: false },
  "403001": { city: "Panaji", state: "Goa", days: 4, cod: true },
  "160017": { city: "Chandigarh", state: "Chandigarh", days: 3, cod: true },
};

const STATE_BY_PREFIX: Record<string, string> = {
  "11": "Delhi", "12": "Haryana", "13": "Haryana", "14": "Punjab", "16": "Chandigarh", "17": "Himachal Pradesh", "18": "Jammu & Kashmir",
  "20": "Uttar Pradesh", "22": "Uttar Pradesh", "24": "Uttarakhand", "25": "Uttar Pradesh", "27": "Uttar Pradesh", "30": "Rajasthan", "31": "Rajasthan", "32": "Rajasthan", "36": "Gujarat", "38": "Gujarat", "39": "Gujarat",
  "40": "Maharashtra", "41": "Maharashtra", "42": "Maharashtra", "44": "Maharashtra", "45": "Madhya Pradesh", "46": "Madhya Pradesh", "50": "Telangana", "51": "Andhra Pradesh", "52": "Andhra Pradesh",
  "56": "Karnataka", "57": "Karnataka", "58": "Karnataka", "60": "Tamil Nadu", "62": "Tamil Nadu", "63": "Tamil Nadu", "67": "Kerala", "68": "Kerala", "69": "Kerala",
  "70": "West Bengal", "71": "West Bengal", "75": "Odisha", "78": "Assam", "80": "Bihar", "82": "Jharkhand",
};

/** Simulated pincode lookup. Returns null when the pincode is malformed or not serviceable. */
export function lookupPincode(pin: string): { ok: true; area: ServiceArea } | { ok: false; reason: "format" | "unserviceable" } {
  if (!/^\d{6}$/.test(pin)) return { ok: false, reason: "format" };
  if (KNOWN[pin]) return { ok: true, area: KNOWN[pin] };
  if (!/^[1-8]/.test(pin) || pin === "000000") return { ok: false, reason: "unserviceable" };
  const state = STATE_BY_PREFIX[pin.slice(0, 2)];
  if (!state) return { ok: false, reason: "unserviceable" };
  const days = 3 + (Number(pin.slice(-1)) % 4);
  return { ok: true, area: { city: "Your area", state, days, cod: Number(pin[0]) < 7 } };
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
