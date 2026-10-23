import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/mcp/route";
import { MCP_SERVERS } from "@/lib/mcp-servers";

function rpc(body: unknown) {
  return POST(
    new NextRequest("https://mcplist.bookchaowalit.com/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function upstream(payload: unknown, status = 200) {
  const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) =>
    typeof payload === "string" ? new Response(payload, { status }) : Response.json(payload, { status }),
  );
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

function sentName(fetchSpy: ReturnType<typeof upstream>) {
  return JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).params.name;
}

afterEach(() => vi.unstubAllGlobals());

describe("/api/mcp tools/call", () => {
  it("keeps underscores in the tool name when proxying (bookchaowalit_fetch_content -> fetch_content)", async () => {
    const fetchSpy = upstream({ jsonrpc: "2.0", id: 5, result: { ok: true } });
    const res = await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "bookchaowalit_fetch_content", arguments: { limit: 2 } } });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://bookchaowalit.com/api/mcp");
    expect(sentName(fetchSpy)).toBe("fetch_content");
    expect(await res.json()).toEqual({ jsonrpc: "2.0", id: 5, result: { ok: true } });
  });

  it("matches a hyphenated server id as a whole prefix", async () => {
    const fetchSpy = upstream({ jsonrpc: "2.0", id: 1, result: {} });
    await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "projects-showcase_get_by_tech" } });
    expect(fetchSpy.mock.calls[0][0]).toBe(`${MCP_SERVERS.find((s) => s.id === "projects-showcase")?.url}/api/mcp`);
    expect(sentName(fetchSpy)).toBe("get_by_tech");
  });

  it("answers the hub's own list_servers from the registry without fetching itself", async () => {
    const fetchSpy = upstream({});
    const res = await rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "mcplist_list_servers", arguments: { tags: ["mcp"] } } });
    const body = await res.json();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(body.id).toBe(9);
    expect(body.result.servers.length).toBeGreaterThan(0);
    for (const server of body.result.servers) expect(server.tags).toContain("mcp");
  });

  it("answers get_server locally and errors for an unknown id", async () => {
    const fetchSpy = upstream({});
    const ok = await (await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "mcplist_get_server", arguments: { id: "artblog" } } })).json();
    expect(ok.result.server.id).toBe("artblog");
    const bad = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "mcplist_get_server", arguments: { id: "nope" } } })).json();
    expect(bad).toMatchObject({ id: 2, error: { code: -32602 } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("proxy_tool_call forwards to a registered server, never to the hub itself", async () => {
    const fetchSpy = upstream({ jsonrpc: "2.0", id: 3, result: { posts: [] } });
    const res = await rpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "mcplist_proxy_tool_call", arguments: { serverId: "artblog", toolName: "get_art_posts", arguments: { limit: 1 } } },
    });
    expect((await res.json()).result).toEqual({ posts: [] });
    expect(fetchSpy.mock.calls[0][0]).toBe("https://artblog.bookchaowalit.com/api/mcp");
    const self = await (
      await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "mcplist_proxy_tool_call", arguments: { serverId: "mcplist", toolName: "list_servers" } } })
    ).json();
    expect(self.error.code).toBe(-32602);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown hub tool instead of pretending to call it", async () => {
    const fetchSpy = upstream({});
    const body = await (await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "mcplist_delete_all" } })).json();
    expect(body).toMatchObject({ id: 6, error: { code: -32602 } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports an upstream that does not answer JSON-RPC as an internal error with the request id", async () => {
    upstream("<html>down</html>", 502);
    const res = await rpc({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "artblog_get_art_posts" } });
    expect(await res.json()).toMatchObject({ jsonrpc: "2.0", id: 7, error: { code: -32603 } });
  });

  it("reports an unreachable upstream as an internal error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const body = await (await rpc({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "artblog_get_art_posts" } })).json();
    expect(body).toMatchObject({ id: 8, error: { code: -32603 } });
  });
});

describe("/api/mcp methods", () => {
  it("echoes the id and lists every declared registry tool under its hub name", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: "a", method: "tools/list" })).json();
    expect(body.id).toBe("a");
    const declared = MCP_SERVERS.flatMap((s) => (s.tools ?? []).map((t) => `${s.id}_${t.name}`));
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(declared);
  });

  it("returns method-not-found with the id for an unknown method", async () => {
    expect(await (await rpc({ jsonrpc: "2.0", id: 11, method: "resources/list" })).json()).toMatchObject({ id: 11, error: { code: -32601 } });
  });

  it("returns a parse error with HTTP 400 for invalid JSON", async () => {
    const res = await rpc("{not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ jsonrpc: "2.0", id: null, error: { code: -32700 } });
  });
});
