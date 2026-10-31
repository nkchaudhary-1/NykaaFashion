"use client";
import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { roleLabel, useTeamSession } from "@/stores/team";

/** Sign-out is a plain form post to the gate (src/proxy.ts), so it works without JavaScript and always clears the cookie on the server. */
function LogoutForm({ className }: { className: string }) {
  return (
    <form method="post" action="/__logout" className="inline-flex">
      <button type="submit" className={className}>
        <LogOut size={14} aria-hidden /> Log out
      </button>
    </form>
  );
}

/**
 * Who is signed in, with Log out — and, for the admin account only, a link to the dashboard. Renders nothing until the server has answered
 * (and nothing at all where accounts are not enabled). `bar` sits in the black strip above the header; `menu` is the block at the top of the phone menu.
 * Hiding the link from non-admins is a convenience: /admin itself is refused to them by the server.
 */
export function SessionChip({ variant, onNavigate }: { variant: "bar" | "menu"; onNavigate?: () => void }) {
  const { status, user } = useTeamSession();
  if (status !== "in" || !user) return null;
  const admin = user.role === "admin";

  if (variant === "bar") {
    return (
      <div role="group" aria-label="Your session" className="flex items-center gap-5">
        <span className="whitespace-nowrap">
          <span className="font-semibold">{user.name}</span> <span className="text-white/75">· {roleLabel(user)}</span>
        </span>
        {admin && (
          <Link href="/admin" className="link-u inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-white">
            <LayoutDashboard size={14} aria-hidden /> Admin dashboard
          </Link>
        )}
        <LogoutForm className="link-u inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-white" />
      </div>
    );
  }
  return (
    <div role="group" aria-label="Your session" className="mb-5 border-b border-line pb-5">
      <p className="eyebrow text-ink-3">Signed in</p>
      <p className="mt-2 text-[20px] leading-tight">
        {user.name} <span className="text-ink-3">· {roleLabel(user)}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {admin && (
          <Link href="/admin" onClick={onNavigate} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-ink px-4 text-[14px] font-medium text-ink">
            <LayoutDashboard size={15} aria-hidden /> Admin dashboard
          </Link>
        )}
        <LogoutForm className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line-strong px-4 text-[14px] font-medium text-ink" />
      </div>
    </div>
  );
}
