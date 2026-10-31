import { NextResponse, type NextRequest } from "next/server";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./components/layout/logo-paths";

/**
 * Password gate for hosted copies of the prototype (Vercel or anywhere else) — no accounts, no database.
 *
 *  • Set SITE_PASSWORD and every request needs the signed `nf_gate` cookie, issued by the sign-in page this file serves itself.
 *  • Leave it unset locally and nothing changes (npm run dev / next start stay open).
 *  • On Vercel (VERCEL is set) a missing SITE_PASSWORD fails CLOSED: the deployment shows "locked" instead of going public.
 *    SITE_GATE=off opts a deployment out on purpose. GATE_SECRET (optional) signs the cookie; it defaults to the password,
 *    so changing the password signs everyone out.
 *  • Only the sign-in page's own assets are public (/_next/static, /fonts, /brand, /icon.svg, /robots.txt). Pictures, the image
 *    optimiser and every page need the cookie.
 *
 * Proxy runs on the Node.js runtime in this version of Next.js; Web Crypto is used so the file also works on the edge.
 */
const COOKIE = "nf_gate";
const MAX_AGE = 60 * 60 * 24 * 7; // a week
const PUBLIC_PREFIXES = ["/_next/static/", "/fonts/", "/brand/"];
const PUBLIC_FILES = new Set(["/icon.svg", "/robots.txt", "/favicon.ico"]);
const SIGN_IN_PATH = "/__gate";

const enc = new TextEncoder();
const password = () => process.env.SITE_PASSWORD ?? "";
const secret = () => process.env.GATE_SECRET || password();

async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
/** Constant-time comparison of two equal-length hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function issueToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${exp}.${await hmac(secret(), `session:${exp}`)}`;
}
async function validToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d{1,12}$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(secret(), `session:${exp}`));
}
/** Only same-site paths survive: "/", "/c/women?x=1" — never "//evil.com" or "/\evil.com". */
const safeNext = (raw: string) => (/^\/(?![/\\])/.test(raw) ? raw : "/");
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HEADERS = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };

const logo = `<svg viewBox="${LOGO_VIEWBOX}" height="26" role="img" aria-label="Nykaa Fashion">${LOGO_PATHS.map((p) => `<path d="${p.d}" fill="${p.tone === "brand" ? "#fc2779" : "#242021"}"/>`).join("")}</svg>`;

function page(title: string, body: string, status: number) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>
@font-face{font-family:"Inter Display";font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+2215}
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#f6f3ef;color:#1c2834;font:400 16px/1.55 "Inter Display",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-variation-settings:"opsz" 32;-webkit-font-smoothing:antialiased}
main{width:min(420px,100%)}h1{margin:28px 0 8px;font-size:30px;line-height:1.1;letter-spacing:-.03em;font-weight:700}p{margin:0 0 20px;color:#414d58}
label{display:block;margin:0 0 8px;font-size:13px;font-weight:600}input{width:100%;height:48px;padding:0 14px;border:0;border-bottom:2px solid #cdd3d3;border-radius:4px 4px 0 0;background:#fff;font:inherit;color:inherit}input:focus{outline:none;border-bottom-color:#982854}
button{width:100%;height:48px;margin-top:14px;border:0;border-radius:4px;background:#001425;color:#fff;font:600 16px "Inter Display",system-ui,sans-serif;cursor:pointer}button:hover{background:#1c2834}button:focus-visible,input:focus-visible{outline:2px solid #1c2834;outline-offset:2px}
.err{margin:12px 0 0;color:#b0221a;font-size:14px}.fine{margin-top:28px;font-size:12.5px;color:#646868}
</style></head><body><main>${logo}${body}</main></body></html>`;
  return new NextResponse(html, { status, headers: HEADERS });
}

const signInPage = (next: string, error: boolean) =>
  page(
    "Nykaa Fashion — private prototype",
    `<h1>Private preview</h1><p>This prototype is password-protected. Enter the password you were given.</p>
<form method="post" action="${SIGN_IN_PATH}"><input type="hidden" name="next" value="${escapeHtml(next)}"><label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus${error ? ' aria-describedby="err" aria-invalid="true"' : ""}><button type="submit">Enter</button>${error ? '<p class="err" id="err" role="alert">That password isn’t right. Try again.</p>' : ""}</form>
<p class="fine">A design prototype of an improved Nykaa Fashion — not the real site. Nothing here is sold; checkout, payments and orders are simulated.</p>`,
    401,
  );

const lockedPage = () =>
  page(
    "Locked",
    `<h1>Locked</h1><p>This deployment has no password configured, so it is not being served. Set the <code>SITE_PASSWORD</code> environment variable in the hosting project and redeploy (or set <code>SITE_GATE=off</code> to publish it openly).</p>`,
    503,
  );

export async function proxy(req: NextRequest) {
  if (process.env.SITE_GATE === "off") return NextResponse.next();
  if (!password()) return process.env.VERCEL ? lockedPage() : NextResponse.next(); // fail closed when hosted

  const { pathname, search } = req.nextUrl;

  // sign-in form
  if (pathname === SIGN_IN_PATH) {
    if (req.method !== "POST") return NextResponse.redirect(new URL("/", req.url), 303);
    const form = await req.formData().catch(() => null);
    const given = String(form?.get("password") ?? "");
    const next = safeNext(String(form?.get("next") ?? "/"));
    const ok = safeEqual(await hmac(secret(), `pw:${given}`), await hmac(secret(), `pw:${password()}`));
    if (!ok) {
      await wait(700); // a small tax on guessing; Vercel adds its own rate limits
      return signInPage(next, true);
    }
    const res = NextResponse.redirect(new URL(next, req.url), 303);
    res.cookies.set({ name: COOKIE, value: await issueToken(), httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: MAX_AGE });
    return res;
  }

  // the sign-in page's own assets
  if (PUBLIC_FILES.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // next/image's optimiser fetches the source picture itself — without the visitor's cookie and without a Host header (self-hosted servers only).
  // Allowed for picture files and nothing else; when the gate is on at build time the app serves /img directly instead (next.config.ts), behind the cookie.
  if (!req.headers.get("host") && pathname.startsWith("/img/") && pathname.endsWith(".webp")) return NextResponse.next();

  if (await validToken(req.cookies.get(COOKIE)?.value)) {
    const res = NextResponse.next();
    res.headers.set("x-robots-tag", "noindex, nofollow");
    return res;
  }

  // browsers get the sign-in page; everything else (images, data, scripts) just gets a 401
  const wantsPage = req.headers.get("accept")?.includes("text/html");
  return wantsPage ? signInPage(safeNext(pathname + search), false) : new NextResponse("Unauthorized", { status: 401, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}
