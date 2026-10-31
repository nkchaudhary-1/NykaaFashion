import { CLOCK_COOKIE, clockOffset } from "@/data/launches";

/** Reads the simulated-clock cookie in the browser ("" on the server). The cookie is set by the Launch clock control on /new-and-next. */
export function readClockCookie(): string {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((c) => c.startsWith(`${CLOCK_COOKIE}=`))?.slice(CLOCK_COOKIE.length + 1) ?? "";
}

/** The current time as the prototype's launch clock sees it: the real time plus the simulated offset (0 unless the control is used). Event handlers and effects only. */
export const launchNow = () => Date.now() + clockOffset(readClockCookie());
