/*
 * The one notification this site sends: when someone signs in with a USER account (never for the admin), a single line goes to the admin — "Someone signed in to the
 * prototype — Sat, 31 Oct 2026, 4:42 pm IST". That is all it says. No name or Login ID, no device, no browser, no IP address, no location, and nothing is kept on
 * this side: there is no database and no log. The record of when people came is the notification itself, in the admin's own notification list.
 *
 * Where it goes: LOGIN_NOTIFY_URL, one URL, set in the hosting project. Works with
 *   • ntfy.sh (a free push service, no account — pick a long random topic: https://ntfy.sh/<topic>, then subscribe to it in the ntfy app or browser);
 *   • a Discord or Slack incoming-webhook URL;
 *   • any endpoint that accepts a plain-text POST.
 * Unset, nothing is sent. Best-effort: a slow or failing endpoint never stops a sign-in.
 */
const zone = "Asia/Kolkata";
const whenFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: zone });

/** "Sat, 31 Oct 2026, 4:42 pm IST" */
export const whenIST = (at: Date) => `${whenFmt.format(at).replace(/\b(am|pm)\b/i, (m) => m.toLowerCase())} IST`;

export function signInMessage(at: Date): string {
  return `Someone signed in to the prototype — ${whenIST(at)}`;
}

/** Sends the one line. Resolves quietly when LOGIN_NOTIFY_URL is not set; rejects if the endpoint fails (the caller ignores that). */
export async function notifyUserSignIn(at: Date = new Date(), timeoutMs = 1500): Promise<void> {
  const url = process.env.LOGIN_NOTIFY_URL?.trim();
  if (!url) return;
  const text = signInMessage(at);
  const discord = /^https:\/\/(?:[\w-]+\.)?discord(?:app)?\.com\/api\/webhooks\//.test(url);
  const slack = /^https:\/\/hooks\.slack\.com\//.test(url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": discord || slack ? "application/json" : "text/plain; charset=utf-8", title: "Prototype opened" },
    body: discord ? JSON.stringify({ content: text }) : slack ? JSON.stringify({ text }) : text,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`notification endpoint answered ${res.status}`);
}
