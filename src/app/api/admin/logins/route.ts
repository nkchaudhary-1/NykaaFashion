import type { NextRequest } from "next/server";
import { clearLogins, loginStoreKind, readLogins } from "@/lib/login-store";
import { adminOnly, json } from "../_shared";

/**
 * Admin only: every sign-in the server has recorded (any browser, any device) — totals, last sign-in and recent history per account.
 * `store` says where they live ("redis", "file") or null when recording is off, in which case the dashboard shows this browser's own records instead.
 */
export async function GET(req: NextRequest) {
  if (!(await adminOnly(req))) return json({ error: "Only an administrator can read the login records." }, 403);
  const store = loginStoreKind();
  if (!store) return json({ store: null, users: [] });
  try {
    return json({ store, users: await readLogins() });
  } catch {
    return json({ store, error: "The login store could not be reached.", users: [] }, 502);
  }
}

/** Admin only: forget one account's records (`{ "id": "kiran" }`) or everyone's (`{}`). */
export async function DELETE(req: NextRequest) {
  if (!(await adminOnly(req))) return json({ error: "Only an administrator can clear the login records." }, 403);
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" && body.id.trim() ? body.id : undefined;
  try {
    await clearLogins(id);
    return json({ ok: true });
  } catch {
    return json({ error: "The login store could not be reached." }, 502);
  }
}
