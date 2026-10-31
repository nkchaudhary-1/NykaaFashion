"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { clearRecords, roleLabel, storageAvailable, useLoginRecords, useTeamSession, type LoginRecord, type TeamUser } from "@/stores/team";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" });
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const SERIES = ["bg-ink", "bg-pink", "bg-ink-3", "bg-emerald"]; // one flat colour per account in the chart

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
  const records = useLoginRecords(accounts.map((a) => a.id));
  const [confirm, setConfirm] = useState<string | null>(null); // "all" or an account id awaiting a second click
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const available = storageAvailable();

  const total = records.reduce((n, r) => n + r.count, 0);
  const lastAll = records.map((r) => r.last).filter((x): x is string => !!x).sort().at(-1) ?? null;
  const byId = new Map(accounts.map((a, i) => [a.id.toLowerCase(), { account: a, record: records[i], color: SERIES[i % SERIES.length] }]));

  // logins per day for the last 14 days, per account
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - i)));
  const perDay = days.map((d) => ({ d, counts: records.map((r) => r.history.filter((h) => dayKey(new Date(h.at)) === dayKey(d)).length) }));
  const peak = Math.max(1, ...perDay.map((x) => x.counts.reduce((a, b) => a + b, 0)));

  const exportCsv = () => {
    const rows = records.flatMap((r) => r.history.map((h) => ({ at: h.at, user: r.id, role: byId.get(r.id.toLowerCase())?.account.role ?? "" })));
    rows.sort((a, b) => b.at.localeCompare(a.at));
    const csv = ["user,role,login_at_iso,date,time", ...rows.map((x) => [x.user, x.role, x.at, fmtDate(x.at), fmtTime(x.at)].map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "nykaa-fashion-login-history.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    setNote(`Exported ${rows.length} login${rows.length === 1 ? "" : "s"}.`);
  };
  const doClear = (what: string) => {
    clearRecords(what === "all" ? undefined : what);
    setConfirm(null);
    setNote(what === "all" ? "All login history cleared in this browser." : `${byId.get(what.toLowerCase())?.account.name ?? what}'s login history cleared.`);
  };

  return (
    <div className={cn(shell, "space-y-16 sm:space-y-24")}>
      {/* what these numbers are */}
      <aside aria-label="About these records" className="max-w-[78ch] border border-line-strong bg-paper p-5 text-[14px] leading-relaxed text-ink-2 sm:p-6">
        <p>
          <strong className="font-medium text-ink">Recorded in this browser only.</strong> This temporary dashboard reads sign-ins saved in this browser&rsquo;s storage. Sign-ins made on other devices or in other browsers are not included, and anyone who can open this
          browser&rsquo;s developer tools can read, change or delete the records. For records that cannot be edited, a server-side store is needed.
        </p>
        {!available && <p className="mt-2 font-medium text-danger">Browser storage is unavailable here (private mode or blocked), so nothing can be recorded or shown.</p>}
      </aside>

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
              {accounts.map((a, i) => (
                <tr key={a.id} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-medium text-ink">{a.name}</th>
                  <td className="py-4 pr-4 text-ink-2">{roleLabel(a)}</td>
                  <td className="py-4 pr-4 text-right tabular-nums text-ink">{records[i].count}</td>
                  <td className="py-4 tabular-nums text-ink-2">{records[i].last ? `${fmtDate(records[i].last!)}, ${fmtTime(records[i].last!)}` : "Never (in this browser)"}</td>
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
          {accounts.map((a, i) => (
            <History key={a.id} account={a} record={records[i]} all={!!showAll[a.id]} onToggle={() => setShowAll((s) => ({ ...s, [a.id]: !s[a.id] }))} />
          ))}
        </div>
      </section>

      {/* a simple chart */}
      <section aria-labelledby="chart-h">
        <h2 id="chart-h" className="eyebrow text-ink-3">
          Logins per day · last 14 days
        </h2>
        <div role="img" aria-label={`Logins per day for the last 14 days. ${accounts.map((a, i) => `${a.name}: ${perDay.reduce((n, x) => n + x.counts[i], 0)}`).join(". ")}.`} className="mt-6">
          <div className="flex h-40 items-end gap-1.5 border-b border-ink sm:gap-2" aria-hidden>
            {perDay.map(({ d, counts }) => (
              <div key={d.toISOString()} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${fmtDate(d.toISOString())}: ${counts.reduce((a, b) => a + b, 0)}`}>
                {counts.map((c, i) => (c ? <div key={accounts[i].id} className={SERIES[i % SERIES.length]} style={{ height: `${(c / peak) * 100}%` }} /> : null))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10.5px] tabular-nums text-ink-3 sm:gap-2" aria-hidden>
            {perDay.map(({ d }) => (
              <span key={d.toISOString()} className="min-w-0 flex-1 text-center">{d.getDate()}</span>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-2">
            {accounts.map((a, i) => (
              <li key={a.id} className="inline-flex items-center gap-2">
                <span aria-hidden className={cn("size-3", SERIES[i % SERIES.length])} /> {a.name}
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
        <div className="mt-10 max-w-[78ch]">
          <h3 className="display-xs">Accounts</h3>
          <div className="mt-4 overflow-x-auto" data-lenis-prevent tabIndex={0} role="region" aria-label="Accounts">
            <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
              <caption className="sr-only">Accounts that can sign in</caption>
              <thead>
                <tr className="border-y border-ink text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th scope="col" className="py-3 pr-4 font-medium">Login ID</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-line">
                    <th scope="row" className="py-3 pr-4 font-medium text-ink">{a.id}</th>
                    <td className="py-3 pr-4 text-ink-2">{a.name}</td>
                    <td className="py-3 text-ink-2">{a.role === "admin" ? "Admin" : `Regular user${a.title ? ` · ${a.title}` : ""}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-3">These two accounts are fixed for this temporary build (they live in the site&rsquo;s SITE_USERS setting, with their passwords, outside the code). There is no screen to add, change or remove accounts, and a regular user cannot reach this page.</p>
        </div>
      </section>
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

function History({ account, record, all, onToggle }: { account: TeamUser; record: LoginRecord; all: boolean; onToggle: () => void }) {
  const shown = all ? record.history : record.history.slice(0, 10);
  return (
    <div>
      <h3 className="display-xs">
        {account.name} <span className="font-normal text-ink-3">· {record.count} login{record.count === 1 ? "" : "s"}</span>
      </h3>
      {record.history.length === 0 ? (
        <p className="mt-4 border-t border-line pt-4 text-[14px] text-ink-3">No logins recorded in this browser yet.</p>
      ) : (
        <>
          <ol className="mt-4 border-t border-ink">
            {shown.map((h, i) => (
              <li key={`${h.event}-${h.at}`} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line py-2.5 text-[14px]">
                <span className="text-[12px] tabular-nums text-ink-3">#{record.count - i}</span>
                <span className="tabular-nums text-ink">{fmtDate(h.at)}</span>
                <span className="tabular-nums text-ink-2">{fmtTime(h.at)}</span>
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
