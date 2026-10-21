import { NextResponse } from "next/server";

// /api/mcp is called from this site and cross-origin from devhub's
// Playground. Only those origins may read responses or trigger a proxied
// tool call from a browser. Override with a comma-separated
// CORS_ALLOWED_ORIGINS (e.g. for a preview domain).
const DEFAULT_ALLOWED_ORIGINS = [
  "https://mcplist.bookchaowalit.com",
  "https://bookchaowalit-mcplist-frontend.vercel.app",
  "https://devhub.bookchaowalit.com",
  "https://bookchaowalit-devhub-frontend.vercel.app",
];

export const ALLOWED_METHODS = "GET, POST, OPTIONS";
export const ALLOWED_HEADERS = "Content-Type";

export function allowedOrigins(): string[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS;
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;
  return configured.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
}

/** No Origin header means a non-browser MCP client; CORS does not apply. */
export function isOriginAllowed(origin: string | null): boolean {
  return origin === null || allowedOrigins().includes(origin);
}

export function withCors(res: NextResponse, origin: string | null): NextResponse {
  res.headers.append("Vary", "Origin");
  if (origin && allowedOrigins().includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.headers.set("Access-Control-Max-Age", "600");
  }
  return res;
}

export function forbiddenOrigin(): NextResponse {
  const res = NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  res.headers.append("Vary", "Origin");
  return res;
}
