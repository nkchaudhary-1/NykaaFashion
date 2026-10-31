import type { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE, type Account } from "@/lib/auth";

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/**
 * The signed-in administrator behind a request to /api/admin/*, or null. The proxy already refuses these paths to everyone else; this checks again
 * in the handler (defence in depth), and a browser request must come from this site: its Origin host has to be the host it was sent to. (Comparing
 * hosts rather than full origins keeps this correct behind proxies that terminate TLS.) A request with no Origin is not a browser form or fetch from
 * another site — it still needs the admin's session cookie.
 */
export async function adminOnly(req: NextRequest): Promise<Account | null> {
  const user = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user || user.role !== "admin") return null;
  const origin = req.headers.get("origin");
  if (origin) {
    const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
    try {
      if (new URL(origin).host.toLowerCase() !== host) return null;
    } catch {
      return null;
    }
  }
  return user;
}
