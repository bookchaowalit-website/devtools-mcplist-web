# MCP List — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `mcplist`) on 2026-10-23.

## What it is

A directory of the 23 MCP servers in this portfolio, curated by hand in `lib/mcp-servers.ts`, with a detail page per
server and a small JSON-RPC endpoint over the same list.

## Who it is for

A developer or AI builder who wants to see which tools each of these servers declares before connecting to it.

## What works today

1. Search servers by name, description or tag (case-insensitive) and filter by one of the first seven tags.
2. `/mcp/<id>` shows a server's notes, declared tools with their input schemas, version and author; an unknown id
   gives a 404 page.
3. `/api/mcp` answers `initialize`, `tools/list`, `servers/list` and `tools/call`, and echoes the request id. The
   hub's own tools (`mcplist_list_servers`, `mcplist_get_server`, `mcplist_proxy_tool_call`) answer from the
   registry; any other registered tool is forwarded to that server's `<url>/api/mcp` and its answer is passed back.
   Unknown servers, hub tools and methods return JSON-RPC errors. Browser calls are limited to an origin allowlist.
4. Front-end and server errors go to Sentry (errors only; request, user, breadcrumbs, extra context and stack frame
   variables stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No compatibility badges, installation guides, user ratings or community submissions (claims flagged in the 2026-10
  card review). It is not a general MCP reference: only this portfolio's own servers are listed.
- No uptime or health checks: whether a listed server is online, or really exposes the declared tools, is not
  verified. A forwarded call fails with a JSON-RPC error when the upstream is down or answers something else.
- No accounts, storage or analytics beyond Vercel Analytics and Speed Insights.

## Live URL and deploy state

- Live: https://mcplist.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-mcplist-frontend` is deployed only by CLI. The last production deployment is the
  CVE patch (2026-10-23 12:14 ICT, CLI, commit e5fc996). Its Git link names the old repository
  `bookchaowalit/bookchaowalit-mcplist-frontend`, so a push to `main` does not deploy: the live site lacks this
  pass's MCP route fixes and Sentry until the owner reconnects Vercel Git to this repository (owner action D9).
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `devtools-mcplist-web`, org `personal-yu0`).

## Boundaries

- Browser-only directory plus the stateless `/api/mcp` route (Edge runtime). The route fetches only URLs declared in
  the registry.
