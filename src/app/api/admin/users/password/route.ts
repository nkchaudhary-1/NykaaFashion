import type { NextRequest } from "next/server";
import { revealSignIn } from "@/lib/auth";
import { adminOnly, json } from "../../_shared";

/** Admin only: the password of a sign-in issued earlier, recomputed from its Login ID and expiry (so it can be sent again). */
export async function POST(req: NextRequest) {
  if (!(await adminOnly(req))) return json({ error: "Only an administrator can do this." }, 403);

  const body = (await req.json().catch(() => null)) as { id?: unknown; expiresAt?: unknown } | null;
  try {
    return json(await revealSignIn(typeof body?.id === "string" ? body.id : "", typeof body?.expiresAt === "string" ? body.expiresAt : ""));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not recompute that sign-in." }, 422);
  }
}
