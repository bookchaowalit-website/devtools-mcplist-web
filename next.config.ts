import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // CORS for /api/mcp lives in app/api/mcp/route.ts (lib/cors.ts):
  // an origin allowlist instead of a wildcard.
};

export default nextConfig;
