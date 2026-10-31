import type { NextRequest } from "next/server";
import { issuedIdProblem, issueSignIn } from "@/lib/auth";
import { adminOnly, json } from "../_shared";

/**
 * Admin only: issue a sign-in (Login ID + generated password + expiry) for someone you want to give access. Nothing is stored — the password
 * is a signature over the Login ID and the expiry (see "sign-ins issued" in src/lib/auth.ts). The proxy already refuses /api/admin/* to every
 * other account; the session is verified again here (adminOnly), and a browser request must come from this site.
 */
export async function POST(req: NextRequest) {
  if (!(await adminOnly(req))) return json({ error: "Only an administrator can add users." }, 403);

  const body = (await req.json().catch(() => null)) as { id?: unknown; days?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const days = Number(body?.days);
  if (!Number.isFinite(days) || days < 1 || days > 90) return json({ error: "Choose how long access lasts: 1 to 90 days." }, 422);
  const problem = issuedIdProblem(id);
  if (problem) return json({ error: problem }, 422);

  return json(await issueSignIn(id, Math.round(days) * 24), 201);
}
