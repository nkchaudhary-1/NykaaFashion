"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { logout } from "@/stores/account";
import { toast } from "@/stores/ui";

const NAV = [
  { href: "/account", label: "Profile", Icon: User },
  { href: "/account/orders", label: "Orders & tracking", Icon: Package },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { ready, user } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Children always render (hidden until signed in) so every segment is part of the prerendered shell.
  const gated = !ready || !user;
  const active = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href));
  return (
    <div className="container-x pb-20 pt-6 sm:pt-10">
      {gated || !user ? (
        <div role="status" aria-label="Loading your account"><Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-14 w-72" /></div>
      ) : (
        <>
          <p className="eyebrow text-ink-3">Your account</p>
          <h1 className="display-lg mt-3">Hello, {user.name.split(" ")[0]}.</h1>
        </>
      )}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        {gated || !user ? (
          <Skeleton className="hidden h-64 w-full lg:block" />
        ) : (
          <aside aria-label="Account">
            <div className="mb-6 hidden items-center gap-4 lg:flex">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-ink text-[16px] font-semibold tracking-wide text-bone">{initials(user.name)}</span>
              <div className="min-w-0"><p className="truncate font-medium">{user.name}</p><p className="truncate text-[12.5px] text-ink-3">{user.email}</p></div>
            </div>
            <nav aria-label="Account sections">
              <ul className="scrollbar-none -mx-[var(--gutter)] flex overflow-x-auto border-b border-line px-[var(--gutter)] lg:mx-0 lg:block lg:border-b-0 lg:border-t lg:px-0">
                {NAV.map(({ href, label, Icon }) => (
                  <li key={href} className="shrink-0 lg:border-b lg:border-line">
                    <Link href={href} aria-current={active(href) ? "page" : undefined} className={cn("relative flex min-h-12 items-center gap-3 px-4 text-[14px] transition-colors lg:px-0", active(href) ? "font-medium text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-ink lg:after:hidden" : "text-ink-2 hover:text-ink")}>
                      <Icon size={17} strokeWidth={1.5} aria-hidden className="hidden lg:block" /> {label}
                    </Link>
                  </li>
                ))}
                <li className="hidden lg:block lg:border-b lg:border-line">
                  <button type="button" onClick={() => (logout(), toast({ title: "Signed out" }), router.push("/"))} className="flex min-h-12 w-full items-center gap-3 text-left text-[14px] text-ink-2 hover:text-ink">
                    <LogOut size={17} strokeWidth={1.5} aria-hidden /> Sign out
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
        )}
        <div className="min-w-0">
          {gated && <Skeleton className="h-96 w-full" />}
          <div hidden={gated}>{children}</div>
        </div>
      </div>
    </div>
  );
}
