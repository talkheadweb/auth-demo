import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // rewrites() removed — /api/[...path]/route.ts is a proper proxy that
  // forwards Set-Cookie and all other response headers rewrites() would drop.
};

export default nextConfig;
