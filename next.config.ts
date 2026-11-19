import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // CORS for /api/mcp lives in app/api/mcp/route.ts (lib/cors.ts):
  // an origin allowlist instead of a wildcard.
  // The old portfolio link page now lives on the main site.
  async redirects() {
    return [{ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true }];
  },
};

export default nextConfig;
