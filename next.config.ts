import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    // On Vercel a password-protected deployment (SITE_PASSWORD set — see src/proxy.ts) serves pictures straight from /img, so they stay behind the cookie:
    // the platform's image optimiser fetches its source without the visitor's credentials. VERCEL is present at build and run time, so both agree;
    // self-hosted servers keep the optimiser (the proxy lets its internal fetch through).
    unoptimized: Boolean(process.env.VERCEL && process.env.SITE_PASSWORD) && process.env.SITE_GATE !== "off",
    // Every image is a crop of the two supplied photographs, written to /public/img by scripts/placeholders (npm run photos).
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 768, 960, 1200, 1600, 1920],
    imageSizes: [64, 96, 160, 240, 320],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  poweredByHeader: false,
  devIndicators: { position: "bottom-left" },
};

export default nextConfig;
