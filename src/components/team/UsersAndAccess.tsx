"use client";
import { Check, Copy, UserPlus } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { forgetIssued, saveIssued, useIssuedUsers, type TeamUser } from "@/stores/team";
import { toast } from "@/stores/ui";

/*
 * Add a user (administrators only — this component is only drawn inside the admin dashboard, and /api/admin/* is refused to everyone else by the server).
 *
 * There is no database, so "adding" a user asks the server to issue a sign-in: a Login ID plus a generated password that is a signature over the ID
 * and the end date. It works on any device and ends by itself; the server remembers nothing (see "sign-ins issued" in src/lib/auth.ts). This list of
 * who was added lives in this browser only (src/stores/team.ts).
 */
interface SignIn {
  id: string;
  name: string;
  password: string;
  expiresAt: string;
}
const DURATIONS = [1, 3, 7, 14, 30];
const ID_RULE = /^[a-z0-9][a-z0-9._-]{2,23}$/;

const whenFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const when = (iso: string) => whenFmt.format(new Date(iso));

const suggestId = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* the password is on screen; it can be selected by hand */
    }
    ta.remove();
  }
  toast({ title: `${what} copied` });
}

const messageFor = (u: SignIn, name: string) =>
  `Hi ${name.trim().split(/\s+/)[0] || "there"},\n\nHere is your sign-in for the Nykaa Fashion prototype (a private design preview):\n${window.location.origin}\n\nLogin ID: ${u.id}\nPassword: ${u.password}\nAccess ends: ${when(u.expiresAt)}\n\nPlease keep the password to yourself.`;

export function UsersAndAccess({ accounts }: { accounts: TeamUser[] }) {
  const issued = useIssuedUsers();
  const now = useNow();

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ signIn: SignIn; name: string } | null>(null);
  const [shown, setShown] = useState<Record<string, SignIn>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (created) resultRef.current?.focus(); // the password is the point of the form: take keyboard and screen-reader users to it
  }, [created]);

  const idValue = idTouched ? id : suggestId(name);
  const idProblem = idValue && !ID_RULE.test(idValue.toLowerCase()) ? "Use 3–24 letters, numbers, dots, dashes or underscores, starting with a letter or a number." : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: idValue, days }) });
      const data = (await res.json().catch(() => ({}))) as Partial<SignIn> & { error?: string };
      if (!res.ok || !data.id || !data.password || !data.expiresAt) {
        setError(data.error ?? "Could not add the user. Try again.");
        return;
      }
      const signIn: SignIn = { id: data.id, name: data.name ?? data.id, password: data.password, expiresAt: data.expiresAt };
      const display = name.trim() || signIn.name;
      saveIssued({ id: signIn.id, name: display, createdAt: new Date().toISOString(), expiresAt: signIn.expiresAt });
      setCreated({ signIn, name: display });
      setName("");
      setId("");
      setIdTouched(false);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reveal(u: { id: string; expiresAt: string }) {
    if (shown[u.id]) {
      setShown((s) => {
        const next = { ...s };
        delete next[u.id];
        return next;
      });
      return;
    }
    setRevealing(u.id);
    try {
      const res = await fetch("/api/admin/users/password", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(u) });
      const data = (await res.json().catch(() => ({}))) as Partial<SignIn> & { error?: string };
      if (!res.ok || !data.password) toast({ title: "Could not show the password", description: data.error, tone: "error" });
      else setShown((s) => ({ ...s, [u.id]: { id: u.id, name: data.name ?? u.id, password: data.password!, expiresAt: u.expiresAt } }));
    } catch {
      toast({ title: "Could not reach the server", tone: "error" });
    } finally {
      setRevealing(null);
    }
  }

  const builtIn = new Set(accounts.map((a) => a.id.toLowerCase()));
  const added = issued.filter((i) => !builtIn.has(i.id.toLowerCase()));
  const cols = 5;

  return (
    <section id="access" aria-labelledby="access-h" className="scroll-mt-28">
      <h2 id="access-h" className="eyebrow text-ink-3">
        Users and access
      </h2>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-[var(--gap)] gap-y-14 lg:grid-cols-12">
        {/* add */}
        <div className="min-w-0 lg:col-span-5">
          <h3 className="display-xs">Add a user</h3>
          <p className="mt-3 max-w-[48ch] text-[14px] leading-relaxed text-ink-2">
            Give someone access to the prototype. They sign in on the same page as you, from any device, as a <strong className="font-medium text-ink">regular user</strong> — they can use the whole site but cannot open this dashboard.
          </p>
          <form onSubmit={submit} noValidate className="mt-6 space-y-5" aria-label="Add a user">
            <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" autoComplete="off" maxLength={60} hint="Only for your list and the message you send." />
            <Input
              label="Login ID"
              name="login-id"
              value={idValue}
              onChange={(e) => {
                setId(e.target.value);
                setIdTouched(true);
              }}
              placeholder="priya.sharma"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={24}
              required
              error={idProblem}
              hint="3–24 characters: letters, numbers, dots, dashes or underscores. Not case-sensitive."
            />
            <Select label="Access lasts" name="days" value={String(days)} onChange={(e) => setDays(Number(e.target.value))} hint="Access ends by itself; it can’t be extended, only replaced by a new sign-in.">
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d === 1 ? "1 day" : `${d} days`}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" loading={busy} icon={<UserPlus size={16} aria-hidden />} disabled={!idValue || !!idProblem}>
                Add user
              </Button>
              {error && (
                <p role="alert" className="text-[13.5px] font-medium text-danger">
                  {error}
                </p>
              )}
            </div>
          </form>

          {created && (
            <div ref={resultRef} tabIndex={-1} role="status" aria-label="New sign-in" className="mt-8 border border-ink p-5 outline-offset-4 sm:p-6">
              <p className="flex items-center gap-2 text-[13px] font-medium text-emerald">
                <Check size={15} aria-hidden /> Added
              </p>
              <h4 className="display-xs mt-2">{created.name} can sign in</h4>
              <SignInDetails signIn={created.signIn} name={created.name} />
            </div>
          )}
        </div>

        {/* who has access */}
        <div className="min-w-0 lg:col-span-7">
          <h3 className="display-xs">Accounts</h3>
          <div className="mt-4 overflow-x-auto" data-lenis-prevent tabIndex={0} role="region" aria-label="Accounts">
            <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
              <caption className="sr-only">Accounts that can sign in, and when their access ends</caption>
              <thead>
                <tr className="border-y border-ink text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th scope="col" className="py-3 pr-4 font-medium">Login ID</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Role</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Access</th>
                  <th scope="col" className="py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-line align-baseline">
                    <th scope="row" className="py-3 pr-4 font-medium text-ink">{a.id}</th>
                    <td className="py-3 pr-4 text-ink-2">{a.name}</td>
                    <td className="py-3 pr-4 text-ink-2">{a.role === "admin" ? "Admin" : `Regular user${a.title ? ` · ${a.title}` : ""}`}</td>
                    <td className="py-3 pr-4 text-ink-2">Built in</td>
                    <td className="py-3" />
                  </tr>
                ))}
                {added.map((u) => {
                  const ended = Date.parse(u.expiresAt) <= now;
                  const open = shown[u.id];
                  return (
                    <Fragment key={u.id}>
                      <tr className="border-b border-line align-baseline">
                        <th scope="row" className="py-3 pr-4 font-medium text-ink">{u.id}</th>
                        <td className="py-3 pr-4 text-ink-2">{u.name}</td>
                        <td className="py-3 pr-4 text-ink-2">Regular user</td>
                        <td className="py-3 pr-4">
                          <span className={cn("block font-medium", ended ? "text-ink-3" : "text-emerald")}>{ended ? "Ended" : "Active"}</span>
                          <span className="block text-[12.5px] text-ink-3">{ended ? "Ended" : "Ends"} {dayFmt.format(new Date(u.expiresAt))}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-x-4 gap-y-6">
                            {!ended && (
                              <button type="button" onClick={() => reveal(u)} disabled={revealing === u.id} aria-expanded={!!open} className="link-u tap text-[12px] font-semibold uppercase tracking-[0.09em]">
                                {open ? "Hide password" : "Show password"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                forgetIssued(u.id);
                                toast({ title: "Removed from this list", description: ended ? undefined : `Their sign-in still works until ${dayFmt.format(new Date(u.expiresAt))}.` });
                              }}
                              className="link-u tap text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-3"
                            >
                              Remove from list
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open && !ended && (
                        <tr className="border-b border-line">
                          <td colSpan={cols} className="py-4">
                            <SignInDetails signIn={open} name={u.name} compact />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {added.length === 0 && <p className="mt-4 text-[14px] text-ink-3">No users added from this browser yet.</p>}

          <div className="mt-6 max-w-[78ch] space-y-3 text-[13px] leading-relaxed text-ink-3">
            <p>
              <strong className="font-medium text-ink-2">How it works.</strong> There is no database, so nothing about an added user is stored on the server: the password is a signed code that carries its own end date, works on any device, and stops working by itself. Passwords can be shown again here because they are recomputed, not looked up.
            </p>
            <p>
              <strong className="font-medium text-ink-2">Ending access sooner.</strong> Add the Login ID to <span className="whitespace-nowrap">SITE_REVOKED</span> in the hosting settings and redeploy (or change <span className="whitespace-nowrap">GATE_SECRET</span> to end every added sign-in). “Remove from list” only tidies this list.
            </p>
            <p>
              <strong className="font-medium text-ink-2">This list is kept in this browser</strong>, like the login records. Added users are always regular users; the two built-in accounts are fixed and live in the site’s <span className="whitespace-nowrap">SITE_USERS</span> setting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignInDetails({ signIn, name, compact }: { signIn: SignIn; name: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap items-end justify-between gap-x-8 gap-y-4" : "mt-5"}>
      <dl className={compact ? "flex flex-wrap gap-x-10 gap-y-3 text-[14px]" : "grid grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-3 text-[14px]"}>
        {!compact && <Detail label="Login ID" value={signIn.id} />}
        <Detail label="Password" value={signIn.password} strong compact={compact} />
        <Detail label="Access ends" value={when(signIn.expiresAt)} compact={compact} />
      </dl>
      <div className={cn("flex flex-wrap gap-3", !compact && "mt-6")}>
        <Button size="sm" variant="secondary" icon={<Copy size={14} aria-hidden />} onClick={() => copyText(signIn.password, "Password")}>
          Copy password
        </Button>
        <Button size="sm" variant="ghost" onClick={() => copyText(messageFor(signIn, name), "Message")}>
          Copy message
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value, strong, compact }: { label: string; value: string; strong?: boolean; compact?: boolean }) {
  return (
    <div className={compact ? "min-w-0" : "contents"}>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-3">{label}</dt>
      <dd className={cn("min-w-0 tabular-nums text-ink", strong ? "whitespace-nowrap text-[17px] font-semibold tracking-[0.06em]" : "break-words", compact ? "mt-1" : "")}>{value}</dd>
    </div>
  );
}
