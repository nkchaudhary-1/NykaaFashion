"use client";
import { useEffect } from "react";
import { loadSession, recordLogin } from "@/stores/team";

const COOKIE = "nf_login_event";
const readCookie = (name: string) => document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;

/**
 * Turns "a sign-in just succeeded" into exactly one login record in this browser. The server sets a short-lived `nf_login_event` cookie only
 * after it has checked the password; here it is confirmed against the signed session (/api/session), recorded for that account, and deleted.
 * A refresh, a second tab or a React dev double-run finds either no cookie or an event id that is already in the record, so nothing is counted twice.
 * Failed sign-ins never set the cookie, so they never count.
 */
export function LoginRecorder() {
  useEffect(() => {
    const event = readCookie(COOKIE);
    if (!event) return;
    void loadSession(true).then(({ user }) => {
      if (user) recordLogin(user, event);
      document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    });
  }, []);
  return null;
}
