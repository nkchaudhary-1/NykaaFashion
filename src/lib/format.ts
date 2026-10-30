const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const inr = (n: number) => `₹${inrFmt.format(Math.round(n))}`;

export function fmtDate(ts: number | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(new Date(ts));
}
export const fmtDateLong = (ts: number | string) => fmtDate(ts, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (ts: number | string) => fmtDate(ts, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const formatMobile = (m: string) => (m.length === 10 ? `+91 ${m.slice(0, 5)} ${m.slice(5)}` : m);
export const maskMobile = (m: string) => (m.length === 10 ? `+91 ${m.slice(0, 2)}••• ••${m.slice(-3)}` : m);
export const maskEmail = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1•••$2");

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function titleCase(s: string) {
  return s.replace(/(^|[\s-])([a-z])/g, (_, a, b) => a + b.toUpperCase());
}
