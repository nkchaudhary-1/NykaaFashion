import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets two dev servers (or a dev and a production server) share one checkout: NEXT_DIST_DIR=.next-b npm run dev -- -p 3102
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // On Vercel a protected deployment (SITE_USERS or SITE_PASSWORD set — see src/proxy.ts) serves pictures straight from /img, so they stay behind the cookie:
    // the platform's image optimiser fetches its source without the visitor's credentials. VERCEL is present at build and run time, so both agree;
    // self-hosted servers keep the optimiser (the proxy lets its internal fetch through).
    unoptimized: Boolean(process.env.VERCEL && (process.env.SITE_PASSWORD || process.env.SITE_USERS)) && process.env.SITE_GATE !== "off",
    // Every image is a crop of the two supplied photographs, written to /public/img by scripts/placeholders (npm run photos).
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 768, 960, 1200, 1600, 1920],
    imageSizes: [64, 96, 160, 240, 320],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  poweredByHeader: false,
  // Hardening for a private prototype: it cannot be framed or re-hosted inside another page, nothing is indexed, no referrer leaks the URL.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
  devIndicators: { position: "bottom-left" },
};

export default nextConfig;
