"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/stores/account";

/** Redirects to /login?next=… once we know (after hydration) that nobody is signed in. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (auth.ready && !auth.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.ready, auth.user, pathname, router]);
  return auth;
}
