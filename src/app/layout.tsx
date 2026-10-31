import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { LoginModal } from "@/components/account/LoginModal";
import { BagDrawer } from "@/components/layout/BagDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MobileShopSheet } from "@/components/layout/MobileShopSheet";
import { PrototypePanel } from "@/components/layout/PrototypePanel";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { LoginRecorder } from "@/components/team/LoginRecorder";
import { Cursor } from "@/components/motion/Cursor";
import { PromoPip } from "@/components/promo/PromoPip";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { NotifyMeHost } from "@/components/product/NotifyMeDialog";
import { QuickViewHost } from "@/components/product/QuickView";
import { SizeGuideHost } from "@/components/product/SizeGuideDialog";
import { ToastRegion } from "@/components/ui/ToastRegion";

// Reveal animations only hide anything while `html.js` is set (see the Motion section of globals.css). The class goes on before first paint and comes off again
// if hydration has not happened after five seconds, so a script failure can never leave the page invisible.
const JS_FLAG = "(function(){var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.classList.contains('hydrated'))d.classList.remove('js')},5000)})()";

// The one typeface, Inter Display: Inter's variable font (optical size 14–32) is self-hosted — see the @font-face rules in globals.css and public/fonts —
// so the app builds and renders without reaching fonts.googleapis.com. The latin file is preloaded; latin-ext (₹ lives there) loads on demand.

// Absolute origin for link-preview URLs (og:image …): NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the fallback; locally it is localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const SHARE_TITLE = "Nykaa Fashion — redesign prototype";
const SHARE_TEXT = "An improved Nykaa Fashion: editorial layouts, a strict grid and motion that stays out of the way. A design prototype with sample data — nothing is sold.";
// public/brand/og.jpg is rendered by scripts/og-image.cjs. It sits under /brand, which the password gate (src/proxy.ts) leaves public so crawlers can fetch it.
const SHARE_IMAGE = { url: "/brand/og.jpg", width: 1200, height: 630, alt: "The Nykaa Fashion wordmark beside a model in a printed kurta set" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SHARE_TITLE, template: "%s · Nykaa Fashion" },
  description: "An improved Nykaa Fashion: the live brand, categories and brands, organised on a stricter grid with a clearer hierarchy. Prototype — checkout, payments, orders and personalisation are simulated.",
  openGraph: { type: "website", siteName: SHARE_TITLE, title: SHARE_TITLE, description: SHARE_TEXT, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: SHARE_TEXT, images: [SHARE_IMAGE.url] },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

function HeaderFallback() {
  return (
    <div className="sticky top-0 z-40 border-b border-transparent bg-bone">
      <div className="container-x flex h-[var(--header-h)] items-center">
        <Logo />
      </div>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main" className="sr-only z-[100] bg-ink px-4 py-3 text-bone focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Skip to content
        </a>
        <Providers>
          <AnnouncementBar />
          {/* usePathname suspends on routes with params unknown at build time (e.g. order ids) — keep the shell prerendered. */}
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <main id="main" tabIndex={-1} className="min-h-[70vh] outline-none">
            {children}
          </main>
          <Footer />
          <Suspense>
            <BottomNav />
          </Suspense>
          <BagDrawer />
          <Suspense>
            <LoginModal />
          </Suspense>
          <SearchOverlay />
          <MobileShopSheet />
          <MobileMenu />
          <QuickViewHost />
          <SizeGuideHost />
          <NotifyMeHost />
          <PrototypePanel />
          <ToastRegion />
          {/* usePathname suspends on routes with unknown params, like the header and bottom nav above */}
          <Suspense>
            <PromoPip />
          </Suspense>
          <RevealObserver />
          <LoginRecorder />
          <Suspense>
            <SmoothScroll />
          </Suspense>
          <Cursor />
        </Providers>
      </body>
    </html>
  );
}
