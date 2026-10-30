import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BagDrawer } from "@/components/layout/BagDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MobileShopSheet } from "@/components/layout/MobileShopSheet";
import { PrototypePanel } from "@/components/layout/PrototypePanel";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { NotifyMeHost } from "@/components/product/NotifyMeDialog";
import { QuickViewHost } from "@/components/product/QuickView";
import { SizeGuideHost } from "@/components/product/SizeGuideDialog";
import { ToastRegion } from "@/components/ui/ToastRegion";

// The one typeface. Inter's optical-size axis (opsz 14–32) is loaded so the page can run at its display cut — "Inter Display" —
// everywhere (globals.css sets opsz 32 on body). ₹ (U+20B9) is in latin-ext.
const inter = Inter({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Nykaa Fashion — Style Files (redesign prototype)", template: "%s · Nykaa Fashion" },
  description: "A curation-first redesign concept for Nykaa Fashion: Hidden Gems, Luxe, the Responsible Edit and House of Nykaa — discover by taste, not discount. Prototype: checkout, payments and personalisation are simulated.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#f5f1ea", width: "device-width", initialScale: 1 };

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
    <html lang="en" className={inter.variable}>
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
          <SearchOverlay />
          <MobileShopSheet />
          <MobileMenu />
          <QuickViewHost />
          <SizeGuideHost />
          <NotifyMeHost />
          <PrototypePanel />
          <ToastRegion />
        </Providers>
      </body>
    </html>
  );
}
