import type { NextRequest } from "next/server";
import { readSession, revealSignIn, SESSION_COOKIE } from "@/lib/auth";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** Admin only: the password of a sign-in issued earlier, recomputed from its Login ID and expiry (so it can be sent again). */
export async function POST(req: NextRequest) {
  const user = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const origin = req.headers.get("origin");
  if (!user || user.role !== "admin" || (origin && origin !== req.nextUrl.origin)) return json({ error: "Only an administrator can do this." }, 403);

  const body = (await req.json().catch(() => null)) as { id?: unknown; expiresAt?: unknown } | null;
  try {
    return json(await revealSignIn(typeof body?.id === "string" ? body.id : "", typeof body?.expiresAt === "string" ? body.expiresAt : ""));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not recompute that sign-in." }, 422);
  }
}
