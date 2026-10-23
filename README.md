# MCP List

A browsable directory of the 23 Model Context Protocol servers in this portfolio. The list is curated by hand in
`lib/mcp-servers.ts`: search it by name, description or tag, filter by one of the first seven tags, and open a detail
page with each server's notes and declared tools. `/api/mcp` is a small JSON-RPC endpoint over the same list.

Live: https://mcplist.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No uptime or health checks, no ratings, no install guides, no compatibility badges, no community submissions.
- It lists only this portfolio's own servers; their declared tools are not verified against the live servers.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: directory logic, MCP route (proxy + CORS), page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## MCP endpoint

`POST /api/mcp` (JSON-RPC 2.0, the request `id` is echoed):

- `initialize`, `tools/list` (every declared tool as `<serverId>_<toolName>`), `servers/list`.
- `tools/call`:
  - `mcplist_list_servers` (optional `tags`), `mcplist_get_server` (`id`) and `mcplist_proxy_tool_call`
    (`serverId`, `toolName`, `arguments`) answer from the registry;
  - any other `<serverId>_<toolName>` is forwarded to that registered server's own `<url>/api/mcp` (10 s timeout),
    and its result or error is passed back. No other URL is ever fetched.
  - Unknown server or hub tool, unknown method, or an upstream that does not answer JSON-RPC give a JSON-RPC error.
- Browser calls are allowed only from the origins in `lib/cors.ts` (override with `CORS_ALLOWED_ORIGINS`).

```bash
curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"mcplist_get_server","arguments":{"id":"artblog"}}}'
```

## Code map

- `lib/mcp-servers.ts`: the curated registry (servers, tools, schemas, tags).
- `lib/mcp-hub.ts`: search, tag options and tool-name resolution, used by the page and the MCP route.
- `lib/cors.ts`: origin allowlist for `/api/mcp`.
- `app/page.tsx`, `app/mcp/[id]/page.tsx`: directory and server detail pages.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).

## Related

- Mobile app: [bookchaowalit-mcplist-mobile](https://github.com/bookchaowalit-mobile/bookchaowalit-mcplist-mobile)
- Portfolio: [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
