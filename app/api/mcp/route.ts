import { NextRequest, NextResponse } from "next/server";
import { MCP_SERVERS, getMCPServerById } from "@/lib/mcp-servers";
import { forbiddenOrigin, isOriginAllowed, withCors } from "@/lib/cors";
import { HUB_ID, listHubTools, resolveTool, serverSummary, serversWithTags } from "@/lib/mcp-hub";

// Stateless JSON-RPC MCP endpoint over the curated registry in lib/mcp-servers.ts.
// The hub's own tools (mcplist_*) answer from that registry. A tool of any other
// registered server is proxied to that server's declared `${url}/api/mcp`, and
// nothing else is ever fetched.

export const runtime = "edge";

const UPSTREAM_TIMEOUT_MS = 10_000;

type RpcId = number | string | null;
type RpcRequest = { id?: RpcId; method?: string; params?: { name?: unknown; arguments?: Record<string, unknown> } };

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !isOriginAllowed(origin)) return forbiddenOrigin();
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

// GET returns a short description of the endpoint.
export async function GET(request: NextRequest) {
  return withCors(serverInfo(), request.headers.get("origin"));
}

function serverInfo() {
  return NextResponse.json({
    name: "MCP List Hub",
    version: "1.0.0",
    description: "JSON-RPC endpoint over the curated MCP List registry",
    endpoints: { mcp: "/api/mcp", documentation: "/", servers: MCP_SERVERS.length },
    usage: { method: "POST", contentType: "application/json", example: { jsonrpc: "2.0", id: 1, method: "initialize" } },
    availableMethods: ["initialize", "tools/list", "tools/call", "servers/list"],
  });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function proxyCall(id: RpcId, url: string, toolName: string, args: unknown) {
  let response: Response;
  try {
    response = await fetch(`${url}/api/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name: toolName, arguments: args ?? {} } }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new RpcError(-32603, `Upstream ${url} is unreachable`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (payload && typeof payload === "object") {
    if ("error" in payload && payload.error) return { error: payload.error };
    if (response.ok && "result" in payload) return { result: payload.result };
  }
  throw new RpcError(-32603, `Upstream ${url} did not answer JSON-RPC (HTTP ${response.status})`);
}

async function callHubTool(id: RpcId, toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    case "list_servers":
      return { result: { servers: serversWithTags(MCP_SERVERS, stringArray(args.tags)).map(serverSummary) } };
    case "get_server": {
      const found = typeof args.id === "string" ? getMCPServerById(args.id) : undefined;
      if (!found) throw new RpcError(-32602, `No registered server with id ${String(args.id)}`);
      return { result: { server: found } };
    }
    case "proxy_tool_call": {
      const target = typeof args.serverId === "string" ? getMCPServerById(args.serverId) : undefined;
      if (!target || target.id === HUB_ID) throw new RpcError(-32602, `Cannot proxy to server ${String(args.serverId)}`);
      if (typeof args.toolName !== "string" || !args.toolName) throw new RpcError(-32602, "toolName must be a string");
      return proxyCall(id, target.url, args.toolName, args.arguments);
    }
    default:
      throw new RpcError(-32602, `Unknown tool: ${HUB_ID}_${toolName}`);
  }
}

async function callTool(id: RpcId, name: unknown, args: Record<string, unknown> = {}) {
  const resolved = resolveTool(name);
  if (!resolved) throw new RpcError(-32601, `No registered server for tool ${String(name)}`);
  if (resolved.server.id === HUB_ID) return callHubTool(id, resolved.toolName, args);
  // Other servers own their tool set, so their own answer (result or error) is passed through.
  return proxyCall(id, resolved.server.url, resolved.toolName, args);
}

async function handleMCPRequest(request: NextRequest) {
  let id: RpcId = null;
  try {
    let body: RpcRequest;
    try {
      body = (await request.json()) as RpcRequest;
    } catch {
      throw new RpcError(-32700, "Parse error");
    }
    if (!body || typeof body !== "object") throw new RpcError(-32600, "Invalid request");
    id = body.id ?? null;
    switch (body.method) {
      case "initialize":
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "mcplist-hub", version: "1.0.0" } },
        });
      case "tools/list":
        return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: listHubTools() } });
      case "tools/call": {
        const outcome = await callTool(id, body.params?.name, body.params?.arguments);
        return NextResponse.json({ jsonrpc: "2.0", id, ...outcome });
      }
      case "servers/list":
        return NextResponse.json({ jsonrpc: "2.0", id, result: { servers: MCP_SERVERS.map(serverSummary) } });
      default:
        throw new RpcError(-32601, `Method not found: ${String(body.method)}`);
    }
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32603;
    const message = error instanceof RpcError ? error.message : "Internal error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: code === -32700 || code === -32600 ? 400 : 200 });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Reject before parsing so a foreign page cannot trigger a proxied call.
  if (!isOriginAllowed(origin)) return forbiddenOrigin();
  return withCors(await handleMCPRequest(request), origin);
}
