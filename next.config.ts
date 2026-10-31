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
