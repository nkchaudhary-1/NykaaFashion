"use client";
import { useState, type ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UsersAndAccess } from "@/components/team/UsersAndAccess";
import { cn } from "@/lib/cn";
import { blankRecord, clearRecords, clearServerLogins, nameFromId, roleLabel, storageAvailable, useIssuedUsers, useLoginRecords, useServerLogins, useTeamSession, type LoginRecord, type TeamUser } from "@/stores/team";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" });
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const SERIES = ["bg-ink", "bg-pink", "bg-ink-3", "bg-emerald"]; // one flat colour per account in the chart
const countryName = (code?: string) => {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};
const where = (h: { device?: string; country?: string }) => [h.device, countryName(h.country)].filter(Boolean).join(" · ");

const shell = "container-x pb-[var(--section-y)]";

/**
 * The login dashboard — administrators only. The server already refuses /admin to everyone else (src/proxy.ts); this component checks the
 * session again so that nothing is drawn, and no record is read, unless the verified account is an admin.
 */
export function AdminDashboard() {
  const session = useTeamSession();
  if (session.status === "loading")
    return (
      <div className={shell}>
        <p role="status" className="text-[15px] text-ink-3">
          Checking your access…
        </p>
      </div>
    );
  if (session.status !== "in" || session.user?.role !== "admin")
    return (
      <div className={shell}>
        <div role="alert" className="max-w-[60ch] border border-ink p-6">
          <p className="display-xs">This area is for administrators.</p>
          <p className="mt-2 text-[14px] text-ink-2">{session.status === "in" ? "Your account does not have access to it." : "Sign in with an administrator account, or run the site with accounts enabled (SITE_USERS)."}</p>
        </div>
      </div>
    );
  return <Dashboard accounts={session.accounts.length ? session.accounts : [session.user]} />;
}

function Dashboard({ accounts }: { accounts: TeamUser[] }) {
  // Where the numbers come from: the server's record of every sign-in (any browser, any device) when the site has a login store; otherwise this browser's own records.
  const server = useServerLogins();
  const serverOn = server.status === "on";
  const browserRecords = useLoginRecords(accounts.map((a) => a.id));
  const builtIn = new Set(accounts.map((a) => a.id.toLowerCase()));
  const issuedHere = useIssuedUsers().filter((u) => !builtIn.has(u.id.toLowerCase()));
  const issuedRecords = useLoginRecords(issuedHere.map((u) => u.id)); // without a store: the sign-ins of users added from this dashboard, made in this browser
  const serverBy = new Map(server.users.map((u) => [u.id.toLowerCase(), u]));
  const records = accounts.map((a, i) => (serverOn ? (serverBy.get(a.id.toLowerCase()) ?? blankRecord(a.id)) : browserRecords[i]));
  const serverAdded = serverOn ? server.users.filter((u) => !builtIn.has(u.id.toLowerCase())) : [];
  const added = serverOn ? serverAdded.map((u) => ({ id: u.id, name: nameFromId(u.id) })) : issuedHere.map((u) => ({ id: u.id, name: u.name }));
  const addedRecords = serverOn ? serverAdded : issuedRecords;
  const people: Array<{ account: TeamUser; record: LoginRecord; added: boolean }> = [
    ...accounts.map((a, i) => ({ account: a, record: records[i], added: false })),
    ...added.map((u, i) => ({ account: { id: u.id, name: u.name, role: "user" as const, title: undefined }, record: addedRecords[i], added: true })),
  ];
  const [confirm, setConfirm] = useState<string | null>(null); // "all" or an account id awaiting a second click
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const available = storageAvailable();

  const total = people.reduce((n, p) => n + p.record.count, 0);
  const lastAll = people.map((p) => p.record.last).filter((x): x is string => !!x).sort().at(-1) ?? null;
  const addedCount = addedRecords.reduce((n, r) => n + r.count, 0);

  // logins per day for the last 14 days: one series per built-in account, and one for everyone added
  const series = [
    ...accounts.map((a, i) => ({ key: a.id, label: a.name, history: records[i].history })),
    ...(addedRecords.length ? [{ key: "__added", label: "Added users", history: addedRecords.flatMap((r) => r.history) }] : []),
  ];
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - i)));
  const perDay = days.map((d) => ({ d, counts: series.map((x) => x.history.filter((h) => dayKey(new Date(h.at)) === dayKey(d)).length) }));
  const peak = Math.max(1, ...perDay.map((x) => x.counts.reduce((a, b) => a + b, 0)));

  const exportCsv = () => {
    const rows = people.flatMap((p) => p.record.history.map((h) => ({ at: h.at, user: p.account.id, role: p.account.role, where: h })));
    rows.sort((a, b) => b.at.localeCompare(a.at));
    const csv = ["user,role,login_at_iso,date,time,device,country", ...rows.map((x) => [x.user, x.role, x.at, fmtDate(x.at), fmtTime(x.at), x.where.device ?? "", x.where.country ?? ""].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "nykaa-fashion-login-history.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    setNote(`Exported ${rows.length} login${rows.length === 1 ? "" : "s"}.`);
  };
  const doClear = async (what: string) => {
    const ok = serverOn ? await clearServerLogins(what === "all" ? undefined : what) : true;
    clearRecords(what === "all" ? undefined : what); // this browser's own records too
    setConfirm(null);
    const who = what === "all" ? "All login history" : `${accounts.find((a) => a.id.toLowerCase() === what.toLowerCase())?.name ?? what}’s login history`;
    setNote(ok ? `${who} cleared${serverOn ? " on the server and in this browser" : " in this browser"}.` : `${who} cleared in this browser, but the server could not be reached.`);
  };

  return (
    <div className={cn(shell, "space-y-16 sm:space-y-24")}>
      {/* what these numbers are — and the one other thing an admin comes here to do */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-[var(--gap)] gap-y-8 lg:grid-cols-12">
        <aside aria-label="About these records" className="order-2 border border-line-strong bg-paper p-5 text-[14px] leading-relaxed text-ink-2 sm:p-6 lg:order-1 lg:col-span-7">
          {server.status === "loading" ? (
            <p role="status">Reading the sign-in records…</p>
          ) : serverOn ? (
            <p>
              <strong className="font-medium text-ink">Recorded on the server.</strong> Every successful sign-in — from any browser or device, at any time — is saved with its date, time, device and country, and shown here. Sign-ins made before this was switched on were
              not recorded on the server and are not included. A failed attempt is never counted.
            </p>
          ) : (
            <p>
              <strong className="font-medium text-ink">Recorded in this browser only.</strong> This site has no login store, so this dashboard reads sign-ins saved in this browser&rsquo;s storage. Sign-ins made on other devices or in other browsers are not included, and anyone
              who can open this browser&rsquo;s developer tools can read, change or delete the records. To record every sign-in from every device, add a login store (README → Login records).
              {server.status === "error" ? " The login store could not be reached just now, so this is the fallback." : ""}
            </p>
          )}
          {!serverOn && !available && server.status !== "loading" && <p className="mt-2 font-medium text-danger">Browser storage is unavailable here (private mode or blocked), so nothing can be recorded or shown.</p>}
        </aside>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:justify-self-end">
          <a href="#access" className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-navy px-6 text-[15px] font-semibold text-bone transition-colors duration-500 hover:bg-pink hover:text-white">
            <UserPlus size={16} aria-hidden /> Add a user
          </a>
          <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-3">Give someone a Login ID and password for the prototype.</p>
        </div>
      </div>

      {/* totals */}
      <section aria-labelledby="totals-h">
        <h2 id="totals-h" className="eyebrow text-ink-3">
          Totals
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-x-[var(--gap)] gap-y-10 lg:grid-cols-4">
          <Stat label="Total logins" value={String(total)} />
          {accounts.map((a, i) => (
            <Stat key={a.id} label={`${a.name} · ${roleLabel(a)}`} value={String(records[i].count)} dot={SERIES[i % SERIES.length]} />
          ))}
          {added.length > 0 && <Stat label="Added users" value={String(addedCount)} sub={`${added.length} user${added.length === 1 ? "" : "s"}`} dot={SERIES[accounts.length % SERIES.length]} />}
          <Stat label="Last login (anyone)" value={lastAll ? fmtDate(lastAll) : "—"} sub={lastAll ? fmtTime(lastAll) : "No logins yet"} small />
        </dl>
      </section>

      {/* per user */}
      <section aria-labelledby="users-h">
        <h2 id="users-h" className="eyebrow text-ink-3">
          Users
        </h2>
        <div className="mt-6 overflow-x-auto" data-lenis-prevent tabIndex={0} role="region" aria-label="Login totals by user">
          <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Login totals and last login for each account</caption>
            <thead>
              <tr className="border-y border-ink text-[11px] uppercase tracking-[0.14em] text-ink-3">
                <th scope="col" className="py-3 pr-4 font-medium">User</th>
                <th scope="col" className="py-3 pr-4 font-medium">Role</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Total logins</th>
                <th scope="col" className="py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.account.id} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-medium text-ink">{p.account.name}</th>
                  <td className="py-4 pr-4 text-ink-2">{p.added ? "Regular user · added" : roleLabel(p.account)}</td>
                  <td className="py-4 pr-4 text-right tabular-nums text-ink">{p.record.count}</td>
                  <td className="py-4 tabular-nums text-ink-2">{p.record.last ? `${fmtDate(p.record.last)}, ${fmtTime(p.record.last)}` : serverOn ? "Never" : "Never (in this browser)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* individual histories */}
      <section aria-labelledby="history-h">
        <h2 id="history-h" className="eyebrow text-ink-3">
          Login history
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-x-[var(--gap)] gap-y-12 lg:grid-cols-2">
          {people.map((p) => (
            <History key={p.account.id} account={p.account} record={p.record} all={!!showAll[p.account.id]} serverOn={serverOn} onToggle={() => setShowAll((s) => ({ ...s, [p.account.id]: !s[p.account.id] }))} />
          ))}
        </div>
      </section>

      {/* a simple chart */}
      <section aria-labelledby="chart-h">
        <h2 id="chart-h" className="eyebrow text-ink-3">
          Logins per day · last 14 days
        </h2>
        <div role="img" aria-label={`Logins per day for the last 14 days. ${series.map((x, i) => `${x.label}: ${perDay.reduce((n, d) => n + d.counts[i], 0)}`).join(". ")}.`} className="mt-6">
          <div className="flex h-40 items-end gap-1.5 border-b border-ink sm:gap-2" aria-hidden>
            {perDay.map(({ d, counts }) => (
              <div key={d.toISOString()} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${fmtDate(d.toISOString())}: ${counts.reduce((a, b) => a + b, 0)}`}>
                {counts.map((c, i) => (c ? <div key={series[i].key} className={SERIES[i % SERIES.length]} style={{ height: `${(c / peak) * 100}%` }} /> : null))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10.5px] tabular-nums text-ink-3 sm:gap-2" aria-hidden>
            {perDay.map(({ d }) => (
              <span key={d.toISOString()} className="min-w-0 flex-1 text-center">{d.getDate()}</span>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-2">
            {series.map((x, i) => (
              <li key={x.key} className="inline-flex items-center gap-2">
                <span aria-hidden className={cn("size-3", SERIES[i % SERIES.length])} /> {x.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* admin controls */}
      <section aria-labelledby="controls-h">
        <h2 id="controls-h" className="eyebrow text-ink-3">
          Admin controls
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={exportCsv} disabled={total === 0}>
            Export CSV
          </Button>
          {accounts.map((a) => (
            <ClearButton key={a.id} label={`Clear ${a.name}’s history`} armed={confirm === a.id} onArm={() => setConfirm(a.id)} onCancel={() => setConfirm(null)} onConfirm={() => doClear(a.id)} />
          ))}
          <ClearButton label="Clear all history" armed={confirm === "all"} onArm={() => setConfirm("all")} onCancel={() => setConfirm(null)} onConfirm={() => doClear("all")} />
        </div>
        <p role="status" className="mt-4 min-h-6 text-[14px] text-ink-2">{note}</p>
      </section>

      {/* add a user, and who has access */}
      <UsersAndAccess accounts={accounts} />
    </div>
  );
}

function Stat({ label, value, sub, dot, small }: { label: string; value: string; sub?: string; dot?: string; small?: boolean }): ReactNode {
  return (
    <div className="border-t border-ink pt-4">
      <dt className="flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-ink-3">
        {dot && <span aria-hidden className={cn("size-2.5", dot)} />}
        {label}
      </dt>
      <dd className={cn("mt-3 tabular-nums", small ? "display-sm" : "display-lg")}>
        {value}
        {sub && <span className="mt-1 block text-[13px] font-normal tracking-normal text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}

function History({ account, record, all, serverOn, onToggle }: { account: TeamUser; record: LoginRecord; all: boolean; serverOn: boolean; onToggle: () => void }) {
  const shown = all ? record.history : record.history.slice(0, 10);
  return (
    <div>
      <h3 className="display-xs">
        {account.name} <span className="font-normal text-ink-3">· {record.count} login{record.count === 1 ? "" : "s"}</span>
      </h3>
      {record.history.length === 0 ? (
        <p className="mt-4 border-t border-line pt-4 text-[14px] text-ink-3">{serverOn ? "No sign-ins recorded yet." : "No logins recorded in this browser yet."}</p>
      ) : (
        <>
          <ol className="mt-4 border-t border-ink">
            {shown.map((h, i) => (
              <li key={`${h.event}-${i}`} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line py-2.5 text-[14px]">
                <span className="text-[12px] tabular-nums text-ink-3">#{record.count - i}</span>
                <span className="tabular-nums text-ink">{fmtDate(h.at)}</span>
                <span className="tabular-nums text-ink-2">{fmtTime(h.at)}</span>
                {where(h) && <span className="col-span-2 col-start-2 mt-0.5 text-[12.5px] text-ink-3">{where(h)}</span>}
              </li>
            ))}
          </ol>
          {record.history.length > 10 && (
            <button type="button" onClick={onToggle} aria-expanded={all} className="link-u tap mt-3 text-[12px] font-semibold uppercase tracking-[0.09em]">
              {all ? "Show the latest 10" : `Show all ${record.history.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ClearButton({ label, armed, onArm, onCancel, onConfirm }: { label: string; armed: boolean; onArm: () => void; onCancel: () => void; onConfirm: () => void }) {
  return armed ? (
    <span role="group" aria-label={`Confirm: ${label}`} className="inline-flex items-center gap-2 border border-danger px-3 py-1">
      <span className="text-[13px] text-danger">Sure?</span>
      <Button size="sm" variant="danger" onClick={onConfirm}>
        Yes, clear
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </span>
  ) : (
    <Button variant="ghost" onClick={onArm}>
      {label}
    </Button>
  );
}
