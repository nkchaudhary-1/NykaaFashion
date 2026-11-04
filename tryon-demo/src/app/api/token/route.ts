// POST /api/token — mints a short-lived Decart client token from the permanent key, and does nothing else.
//
//  • The permanent key (DECART_API_KEY, dct_…) lives in server env only and is never returned or logged.
//  • The browser receives only the ephemeral token (~60 s). The provider adapter asks for a fresh one on every
//    connect and reconnect, so nothing is minted on page load.
//  • Same-origin only: this demo is for local / private review, not a public token dispenser.
import { createDecartClient } from "@decartai/sdk";
import { resolveConfig } from "@/lib/config";

const NO_STORE = { "Cache-Control": "no-store" } as const;
const MINT_TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  const key = process.env.DECART_API_KEY?.trim();
  const config = resolveConfig();

  // Simulation mode needs no token. Answer plainly so a stray call can never be mistaken for a working live path.
  if (!key || config.mode !== "live") {
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === request.headers.get("host");
    } catch {
      /* malformed Origin header */
    }
    if (!sameOrigin) return Response.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const client = createDecartClient({ apiKey: key });
    const mint = client.tokens.create({
      expiresIn: 60,
      // Cost guardrail: the provider itself ends a session at this length, whatever the browser does.
      ...(config.maxSessionSeconds > 0
        ? { constraints: { realtime: { maxSessionDuration: config.maxSessionSeconds } } }
        : {}),
    });
    // A hung network must surface as an error the panel can show, not as a spinner.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error("mint timed out"), { code: "MINT_TIMEOUT" })), MINT_TIMEOUT_MS);
    });
    const token = await Promise.race([mint, timeout]);
    return Response.json({ apiKey: token.apiKey, expiresAt: token.expiresAt }, { headers: NO_STORE });
  } catch (err) {
    // Log the SDK's error CODE only. Never the error object (may carry request details), never the key or a token.
    const code = (err as { code?: unknown } | null)?.code;
    console.error(`[tryon] token mint failed${typeof code === "string" ? ` (${code})` : ""}`);
    return Response.json({ error: "mint_failed" }, { status: 502, headers: NO_STORE });
  } finally {
    clearTimeout(timer);
  }
}
