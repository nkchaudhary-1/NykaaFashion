// Simulated payment helpers. Nothing here talks to a payment network.
export const luhn = (num: string): boolean => {
  const d = num.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

export const cardBrand = (num: string): "Visa" | "Mastercard" | "RuPay" | "Amex" | null => {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^(60|65|81|82|508)/.test(d)) return "RuPay";
  if (/^3[47]/.test(d)) return "Amex";
  return null;
};

export const formatCard = (num: string): string => num.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
export const formatExpiry = (v: string): string => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Expiry must be MM/YY and not in the past. `now` is passed in (never read during render). */
export const validExpiry = (v: string, now: number): boolean => {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const mm = Number(m[1]);
  const yy = 2000 + Number(m[2]);
  if (mm < 1 || mm > 12) return false;
  const d = new Date(now);
  return yy > d.getFullYear() || (yy === d.getFullYear() && mm >= d.getMonth() + 1);
};

export const validUpi = (v: string) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(v.trim());

export const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Yes Bank"];
export const WALLETS = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik"];

/** Deterministic simulated outcome so error states can be reviewed on purpose. */
export function simulateOutcome(method: string, detail: { upi?: string; card?: string }): { ok: true } | { ok: false; reason: string } {
  if (method === "upi" && /^fail/i.test(detail.upi ?? "")) return { ok: false, reason: "The UPI request was declined by the bank (simulated)." };
  if (method === "card" && (detail.card ?? "").replace(/\D/g, "").endsWith("0002")) return { ok: false, reason: "The card was declined (simulated test card ending 0002)." };
  return { ok: true };
}
