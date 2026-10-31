import { NextResponse, type NextRequest } from "next/server";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./components/layout/logo-paths";
import { CLOCK_COOKIE, clockOffset, isLaunched, launchById, launchOfSlug } from "./data/launches";
import { accountsConfig, hmac, issueSession, LOGIN_EVENT_COOKIE, randomId, readSession, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE, verifyLogin } from "./lib/auth";

/**
 * Access gate for hosted copies of the prototype (Vercel or anywhere else) — no database.
 *
 *  • Named accounts (SITE_USERS, see lib/auth.ts): the sign-in page asks for a Login ID and password, the server checks them and sets a signed
 *    HttpOnly session cookie that names the account; the role (admin / user) is looked up from the configuration on every request. /admin is
 *    served to admins only (403 for everyone else); POST /__logout ends the session. A one-time `nf_login_event` cookie tells the app that a
 *    sign-in just succeeded, so it can write the login record in the browser. With SITE_USERS set, SITE_PASSWORD is ignored.
 *  • Without accounts, the single shared password below:
 *
 *  • Set SITE_PASSWORD and every request needs the signed `nf_gate` cookie, issued by the sign-in page this file serves itself.
 *  • Leave it unset locally and nothing changes (npm run dev / next start stay open).
 *  • On Vercel (VERCEL is set) a missing SITE_PASSWORD fails CLOSED: the deployment shows "locked" instead of going public.
 *    SITE_GATE=off opts a deployment out on purpose. GATE_SECRET (optional) signs the cookie; it defaults to the password,
 *    so changing the password signs everyone out.
 *  • Only the sign-in page's own assets are public (its font, the share-card image, /icon.svg, /robots.txt). Pages, pictures, the image
 *    optimiser and the compiled JS/CSS all need the cookie.
 *  • SITE_EXPIRES (optional, an ISO date such as 2026-11-15 or 2026-11-15T18:00:00+05:30) locks the whole site after that moment, cookie or not.
 *
 * Proxy runs on the Node.js runtime in this version of Next.js; Web Crypto is used so the file also works on the edge.
 */
const COOKIE = "nf_gate";
const MAX_AGE = 60 * 60 * 24 * 7; // a week
// Exactly what the sign-in page and its link-preview card need — nothing else is served without the cookie, including the compiled app (/_next/static).
const PUBLIC_FILES = new Set(["/fonts/inter-latin.woff2", "/brand/og.jpg", "/icon.svg", "/robots.txt", "/favicon.ico"]);
const SIGN_IN_PATH = "/__gate";
const LOGOUT_PATH = "/__logout";

const password = () => process.env.SITE_PASSWORD ?? "";
const secret = () => process.env.GATE_SECRET || password();

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

const HEADERS = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "x-frame-options": "DENY", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };

const logo = `<svg viewBox="${LOGO_VIEWBOX}" height="26" role="img" aria-label="Nykaa Fashion">${LOGO_PATHS.map((p) => `<path d="${p.d}" fill="${p.tone === "brand" ? "#fc2779" : "#15120f"}"/>`).join("")}</svg>`;

function page(title: string, body: string, status: number, head = "") {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f4efe8"><title>${title}</title>${head}
<style>
@font-face{font-family:"Inter Display";font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+2215}
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#f4efe8;color:#15120f;font:400 16px/1.55 "Inter Display",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-variation-settings:"opsz" 32;-webkit-font-smoothing:antialiased}
main{width:min(460px,100%)}h1{margin:44px 0 14px;font-size:clamp(38px,9vw,60px);line-height:.96;letter-spacing:-.055em;font-weight:500}p{margin:0 0 24px;color:#403a33}
label{display:block;margin:18px 0 8px;font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#675f55}input{width:100%;height:52px;padding:0 14px;border:0;border-bottom:2px solid #c0b6a6;border-radius:4px 4px 0 0;background:#faf7f2;font:inherit;color:inherit}input:focus{outline:none;border-bottom-color:#982854}
button{width:100%;height:52px;margin-top:14px;border:0;border-radius:4px;background:#15120f;color:#f4efe8;font:600 16px "Inter Display",system-ui,sans-serif;cursor:pointer;transition:background-color .4s cubic-bezier(.16,1,.3,1)}button:hover{background:#982854;color:#fff}button:focus-visible,input:focus-visible{outline:2px solid #15120f;outline-offset:2px}
.err{margin:12px 0 0;color:#b0221a;font-size:14px}.fine{margin-top:32px;font-size:12.5px;color:#675f55}
</style></head><body><main>${logo}${body}</main></body></html>`;
  return new NextResponse(html, { status, headers: HEADERS });
}

/** What a link-preview crawler (WhatsApp, Slack, iMessage, LinkedIn, X …) reads from a protected link: it never has the cookie, so the sign-in page carries the card. */
const PREVIEW_TITLE = "Nykaa Fashion — redesign prototype";
const PREVIEW_TEXT = "An improved Nykaa Fashion: editorial layouts, a strict grid and motion that stays out of the way. A private design prototype with sample data — nothing is sold.";
const previewTags = (origin: string, pathname: string) => {
  const image = `${origin}/brand/og.jpg`;
  const meta = (k: string, v: string) => `<meta ${k.startsWith("og:") ? "property" : "name"}="${k}" content="${escapeHtml(v)}">`;
  return [
    meta("description", PREVIEW_TEXT),
    meta("og:type", "website"), meta("og:site_name", PREVIEW_TITLE), meta("og:title", PREVIEW_TITLE), meta("og:description", PREVIEW_TEXT), meta("og:url", origin + pathname),
    meta("og:image", image), meta("og:image:width", "1200"), meta("og:image:height", "630"), meta("og:image:alt", "The Nykaa Fashion wordmark beside a model in a printed kurta set"),
    meta("twitter:card", "summary_large_image"), meta("twitter:title", PREVIEW_TITLE), meta("twitter:description", PREVIEW_TEXT), meta("twitter:image", image),
  ].join("");
};

const signInPage = (next: string, error: boolean, origin: string, pathname: string, named = false) =>
  page(
    PREVIEW_TITLE,
    `<h1>${named ? "Sign in" : "Private preview"}</h1><p>${named ? "This prototype is private. Sign in with your Login ID and password." : "This prototype is password-protected. Enter the password you were given."}</p>
<form method="post" action="${SIGN_IN_PATH}"><input type="hidden" name="next" value="${escapeHtml(next)}">${named ? `<label for="uid">Login ID</label><input id="uid" name="userid" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required autofocus${error ? ' aria-invalid="true"' : ""}>` : ""}<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required${named ? "" : " autofocus"}${error ? ' aria-describedby="err" aria-invalid="true"' : ""}><button type="submit">${named ? "Sign in" : "Enter"}</button>${error ? `<p class="err" id="err" role="alert">${named ? "That Login ID or password isn’t right. Try again." : "That password isn’t right. Try again."}</p>` : ""}</form>
<p class="fine">A design prototype of an improved Nykaa Fashion — not the real site. Nothing here is sold; checkout, payments and orders are simulated.</p>
<p class="fine">Confidential — shared for review only. Please don’t copy, save or pass on the design, code or pictures.</p>`,
    error ? 401 : 200, // 200 for the plain sign-in page: link-preview crawlers ignore a card served with an error status
    previewTags(origin, pathname),
  );

const endedPage = () =>
  page("Preview ended", `<h1>Preview ended</h1><p>This private preview has been closed. Ask the owner if you need access again.</p>`, 410);
const expired = () => {
  const at = Date.parse(process.env.SITE_EXPIRES ?? "");
  return Number.isFinite(at) && Date.now() > at;
};

const lockedPage = (invalid = false) =>
  page(
    "Locked",
    invalid
      ? `<h1>Locked</h1><p>The <code>SITE_USERS</code> environment variable is set but is not a valid list of accounts, so this deployment is not being served. Fix it in the hosting project and redeploy.</p>`
      : `<h1>Locked</h1><p>This deployment has no access configured, so it is not being served. Set <code>SITE_USERS</code> (named accounts) or <code>SITE_PASSWORD</code> (one shared password) in the hosting project and redeploy, or set <code>SITE_GATE=off</code> to publish it openly.</p>`,
    503,
  );

const forbiddenPage = () =>
  page("Admin only", `<h1>Admin only</h1><p>This area is for administrators. You are signed in, but your account does not have access to it.</p><p><a href="/" style="color:#982854">Back to the site</a></p>`, 403);

/**
 * New & Next: a product page of a brand that has not launched yet redirects to that brand's launch page (where the piece opens as a preview).
 * Runs only for requests the gate has already let through, and honours the simulated launch clock (cookie) so the "launch day" demo reaches the real page.
 */
function launchGuard(req: NextRequest): NextResponse | null {
  const slug = /^\/p\/([^/]+)\/?$/.exec(req.nextUrl.pathname)?.[1];
  const launch = slug ? launchById[launchOfSlug[slug]] : undefined;
  if (!launch || isLaunched(launch, Date.now() + clockOffset(req.cookies.get(CLOCK_COOKIE)?.value))) return null;
  const res = NextResponse.redirect(new URL(`/new-and-next/${launch.id}?piece=${slug}`, req.url), 307);
  res.headers.set("cache-control", "no-store");
  return res;
}

export async function proxy(req: NextRequest) {
  const res = await gate(req);
  if (res.headers.get("x-middleware-next") !== "1") return res; // the gate answered itself (sign-in page, redirect, 401, 403 …)
  return launchGuard(req) ?? res;
}

async function gate(req: NextRequest) {
  if (process.env.SITE_GATE === "off") return NextResponse.next();
  const accounts = accountsConfig();
  if (accounts === "invalid") return lockedPage(true); // configured but unusable: never fall open
  const named = accounts !== null;
  if (!named && !password()) return process.env.VERCEL ? lockedPage() : NextResponse.next(); // fail closed when hosted

  const { pathname, search } = req.nextUrl;
  const secure = req.nextUrl.protocol === "https:";

  // a time-boxed review: after SITE_EXPIRES nothing is served, not even to a valid cookie
  if (expired()) return req.headers.get("accept")?.includes("text/html") ? endedPage() : new NextResponse("Gone", { status: 410, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });

  // sign-in form
  if (pathname === SIGN_IN_PATH) {
    if (req.method !== "POST") return NextResponse.redirect(new URL("/", req.url), 303);
    const form = await req.formData().catch(() => null);
    const given = String(form?.get("password") ?? "");
    const next = safeNext(String(form?.get("next") ?? "/"));
    if (named) {
      const account = await verifyLogin(String(form?.get("userid") ?? ""), given);
      if (!account) {
        await wait(700); // a small tax on guessing; Vercel adds its own rate limits
        return signInPage(next, true, req.nextUrl.origin, "/", true);
      }
      // Authentication succeeded: the signed session says who this is; the one-time event cookie lets the app write exactly one login record.
      const res = NextResponse.redirect(new URL(next, req.url), 303);
      res.cookies.set({ name: SESSION_COOKIE, value: await issueSession(account.id), httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
      res.cookies.set({ name: LOGIN_EVENT_COOKIE, value: randomId(), httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 120 });
      return res;
    }
    const ok = safeEqual(await hmac(secret(), `pw:${given}`), await hmac(secret(), `pw:${password()}`));
    if (!ok) {
      await wait(700);
      return signInPage(next, true, req.nextUrl.origin, "/");
    }
    const res = NextResponse.redirect(new URL(next, req.url), 303);
    res.cookies.set({ name: COOKIE, value: await issueToken(), httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: MAX_AGE });
    return res;
  }

  // sign out: ends the session (the login records in the browser are left alone)
  if (pathname === LOGOUT_PATH) {
    const res = NextResponse.redirect(new URL("/", req.url), 303);
    if (req.method === "POST") for (const name of [SESSION_COOKIE, LOGIN_EVENT_COOKIE, COOKIE]) res.cookies.set({ name, value: "", path: "/", maxAge: 0 });
    return res;
  }

  // the sign-in page's own assets
  if (PUBLIC_FILES.has(pathname)) return NextResponse.next();

  // next/image's optimiser fetches the source picture itself — without the visitor's cookie and without a Host header (self-hosted servers only).
  // Allowed for picture files and nothing else; when the gate is on at build time the app serves /img directly instead (next.config.ts), behind the cookie.
  if (!req.headers.get("host") && pathname.startsWith("/img/") && pathname.endsWith(".webp")) return NextResponse.next();

  const session = named ? await readSession(req.cookies.get(SESSION_COOKIE)?.value) : null;
  if (named ? session : await validToken(req.cookies.get(COOKIE)?.value)) {
    // the admin dashboard and anything under it: administrators only — enforced here, on the server, before any page or data is served
    if (named && (pathname === "/admin" || pathname.startsWith("/admin/")) && session?.role !== "admin") {
      return req.headers.get("accept")?.includes("text/html") ? forbiddenPage() : new NextResponse("Forbidden", { status: 403, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
    }
    const res = NextResponse.next();
    res.headers.set("x-robots-tag", "noindex, nofollow");
    return res;
  }

  // Page requests get the sign-in page: browsers (Accept: text/html) and link-preview crawlers (which send Accept: */* and no Sec-Fetch headers, for a path without a file extension).
  // Everything else — pictures, scripts, data, RSC fetches — just gets a 401.
  const dest = req.headers.get("sec-fetch-dest");
  const notAPage = /\.[a-z0-9]{2,5}$/i.test(pathname) || pathname.startsWith("/api/") || pathname.startsWith("/_next/"); // files, endpoints and framework data are never the sign-in page
  const wantsPage = req.headers.get("accept")?.includes("text/html") || (!notAPage && (!dest || dest === "document"));
  return wantsPage ? signInPage(safeNext(pathname + search), false, req.nextUrl.origin, pathname, named) : new NextResponse("Unauthorized", { status: 401, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}
