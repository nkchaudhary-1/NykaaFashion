import { cookies } from "next/headers";
import { listAccounts, readSession, SESSION_COOKIE } from "@/lib/auth";

/**
 * Who is signed in, as verified by the server from the signed session cookie. The app asks this once per page load to decide what to show
 * (the session chip, the admin dashboard); admins also get the account list so the dashboard can show users with no logins yet.
 * No passwords, ever. Without accounts configured (local development) the answer is simply "nobody".
 */
export async function GET() {
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return Response.json({ user, accounts: user?.role === "admin" ? listAccounts() : undefined }, { headers: { "cache-control": "no-store" } });
}
