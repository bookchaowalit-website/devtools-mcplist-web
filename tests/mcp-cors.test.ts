import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "@/next.config";
import { GET, OPTIONS, POST } from "@/app/api/mcp/route";
import { MCP_SERVERS } from "@/lib/mcp-servers";

const URL_ = "https://mcplist.bookchaowalit.com/api/mcp";
const FOREIGN = "https://evil.example";
const DEVHUB = "https://devhub.bookchaowalit.com";

function req(method: string, headers: Record<string, string> = {}, body?: unknown) {
  return new NextRequest(URL_, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("/api/mcp CORS", () => {
  it("next.config does not send a wildcard Access-Control-Allow-Origin", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const values = rules.flatMap((r) => r.headers.map((h) => `${h.key}: ${h.value}`));
    expect(values).not.toContain("Access-Control-Allow-Origin: *");
  });

  it("rejects a preflight from a foreign origin", async () => {
    const res = await OPTIONS(req("OPTIONS", { origin: FOREIGN, "access-control-request-method": "POST" }));
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows a preflight from devhub with only the needed methods", async () => {
    const res = await OPTIONS(req("OPTIONS", { origin: DEVHUB, "access-control-request-method": "POST" }));
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(DEVHUB);
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("access-control-allow-headers")).toBe("Content-Type");
    expect(res.headers.get("vary")).toContain("Origin");
  });

  it("reads the allowlist from CORS_ALLOWED_ORIGINS", async () => {
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://staging.example");
    const ok = await OPTIONS(req("OPTIONS", { origin: "https://staging.example" }));
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://staging.example");
    const no = await OPTIONS(req("OPTIONS", { origin: DEVHUB }));
    expect(no.status).toBe(403);
  });

  it("refuses to proxy a POST sent from a foreign origin", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(
      req("POST", { origin: FOREIGN }, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "bookchaowalit_fetch", arguments: {} } }),
    );
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("answers GET/POST from an allowed origin with that origin, never *", async () => {
    const res = await GET(req("GET", { origin: DEVHUB }));
    expect(res.headers.get("access-control-allow-origin")).toBe(DEVHUB);
    const post = await POST(req("POST", { origin: DEVHUB }, { jsonrpc: "2.0", id: 1, method: "servers/list" }));
    expect(post.status).toBe(200);
    expect(post.headers.get("access-control-allow-origin")).toBe(DEVHUB);
  });
});

describe("/api/mcp proxy targets", () => {
  it("only fetches URLs from the fixed MCP_SERVERS list", async () => {
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => Response.json({ jsonrpc: "2.0", id: 1, result: {} }));
    vi.stubGlobal("fetch", fetchSpy);
    const target = MCP_SERVERS[0];
    await POST(req("POST", {}, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: `${target.id}_fetch`, arguments: {} } }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${target.url}/api/mcp`);
  });

  it("does not fetch for an unknown server id or an injected URL", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const name of ["unknown_tool", "https://evil.example_tool", "169.254.169.254_tool"]) {
      const res = await POST(req("POST", {}, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: {} } }));
      const body = await res.json();
      expect(body.error?.code).toBe(-32601);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
