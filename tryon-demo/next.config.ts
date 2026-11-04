import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This demo lives inside a larger repo; keep Turbopack's root here instead of the parent's lockfile.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  poweredByHeader: false,
  devIndicators: { position: "bottom-left" },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Camera is allowed for this origin only; mic and everything else off.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Local / private review only — keep it out of search indexes.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
