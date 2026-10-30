"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import type { ReactNode } from "react";
import { Col, Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
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

/** One look for every nav entry: a flat square tab on phones and tablets, a full-width row on desktop. Current = pink tint with a pink edge. */
const item = "relative flex shrink-0 items-center gap-2.5 whitespace-nowrap border text-[13.5px] font-medium transition-colors h-11 px-4 lg:h-12 lg:w-full lg:gap-3 lg:border-x-0 lg:border-t-0 lg:text-[14px]";
const on = "border-pink bg-pink-tint text-pink-ink lg:border-line lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-[3px] lg:before:bg-pink lg:before:content-['']";
const off = "border-line-strong text-ink hover:border-ink lg:border-line lg:hover:bg-paper";

/**
 * Account shell on the 12-column grid: a 3-column side navigation (a flat tab row below 1024px) beside a 9-column content area.
 * Sub-pages nest their own grids inside the 9 columns, so their sub-columns still land on the page's columns.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const { ready, user } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Children always render (hidden until signed in) so every segment is part of the prerendered shell.
  const gated = !ready || !user;
  const active = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href));
  return (
    <>
      {gated || !user ? (
        <div className="container-x pb-8 pt-6 sm:pb-12 sm:pt-8" role="status" aria-label="Loading your account">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-8 h-3 w-28" />
          <Skeleton className="mt-4 h-14 w-72" />
        </div>
      ) : (
        <PageHeader
          crumbs={[{ name: "Home", href: "/" }, { name: "Account" }]}
          eyebrow="Your account"
          title={`Hello, ${user.name.split(" ")[0]}.`}
          intro="Orders, addresses and saved pieces. This is a prototype account — everything stays on this device."
        />
      )}
      <div className="container-x pb-[var(--section-y)]">
        <Grid className="gap-y-8 lg:gap-y-0">
          <Col span={{ base: 4, sm: 12, lg: 3 }}>
            {gated || !user ? (
              <Skeleton className="hidden h-72 w-full lg:block" />
            ) : (
              <aside aria-label="Account" className="lg:sticky lg:top-[calc(var(--header-offset)+16px)] lg:transition-[top] lg:duration-500 lg:ease-editorial">
                <div className="mb-6 hidden items-center gap-4 lg:flex">
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-[16px] font-semibold tracking-wide text-bone">{initials(user.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-[12.5px] text-ink-3">{user.email}</p>
                  </div>
                </div>
                <nav aria-label="Account sections">
                  <ul className="scrollbar-none -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:block lg:overflow-visible lg:border-t lg:border-ink lg:px-0">
                    {NAV.map(({ href, label, Icon }) => (
                      <li key={href} className="shrink-0 lg:shrink">
                        <Link href={href} aria-current={active(href) ? "page" : undefined} className={cn(item, active(href) ? on : off, "lg:px-4")}>
                          <Icon size={17} strokeWidth={1.5} aria-hidden className="hidden lg:block" /> {label}
                        </Link>
                      </li>
                    ))}
                    <li className="shrink-0 lg:shrink">
                      <button type="button" onClick={() => (logout(), toast({ title: "Signed out" }), router.push("/"))} className={cn(item, off, "lg:px-4 lg:text-left")}>
                        <LogOut size={17} strokeWidth={1.5} aria-hidden className="hidden lg:block" /> Sign out
                      </button>
                    </li>
                  </ul>
                </nav>
              </aside>
            )}
          </Col>
          <Col span={{ base: 4, sm: 12, lg: 9 }}>
            {gated && <Skeleton className="h-96 w-full" />}
            <div hidden={gated}>{children}</div>
          </Col>
        </Grid>
      </div>
    </>
  );
}
