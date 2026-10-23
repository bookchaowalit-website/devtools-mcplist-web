// Directory search and MCP tool-name rules over the curated registry in lib/mcp-servers.ts.
// Used by the home page and the /api/mcp route. Pure functions, no I/O.

import { MCP_SERVERS, type MCPServer } from "@/lib/mcp-servers";

/** The id of this site's own registry entry. Its tools are answered locally, never proxied to ourselves. */
export const HUB_ID = "mcplist";

/** "All" plus the first `limit` distinct tags in registry order. */
export function tagOptions(servers: MCPServer[], limit = 7): string[] {
  return ["All", ...Array.from(new Set(servers.flatMap((server) => server.tags ?? []))).slice(0, limit)];
}

/** Servers carrying `tag` ("All" for every server) whose name, description or tags contain `query`, ignoring case. */
export function filterServers(servers: MCPServer[], tag: string, query: string): MCPServer[] {
  const needle = query.trim().toLowerCase();
  return servers.filter((server) => {
    const haystack = `${server.name} ${server.description} ${(server.tags ?? []).join(" ")}`.toLowerCase();
    return (tag === "All" || (server.tags ?? []).includes(tag)) && haystack.includes(needle);
  });
}

/** Servers that carry every tag in `tags` (all servers when `tags` is empty). */
export function serversWithTags(servers: MCPServer[], tags: string[]): MCPServer[] {
  return servers.filter((server) => tags.every((tag) => (server.tags ?? []).includes(tag)));
}

/** Every registered tool under its hub name `<serverId>_<toolName>`, with the schema the registry declares. */
export function listHubTools(servers: MCPServer[] = MCP_SERVERS) {
  return servers.flatMap((server) =>
    (server.tools ?? []).map((tool) => ({
      name: `${server.id}_${tool.name}`,
      description: `${tool.description} (${server.name})`,
      inputSchema: tool.inputSchema ?? { type: "object", properties: {} },
    })),
  );
}

/**
 * Split a hub tool name into a registered server and the rest of the name.
 * The server id is matched as a whole prefix (longest first), so tool names that
 * contain "_" (`bookchaowalit_fetch_content`) keep their full name. Returns null
 * when no registered server id prefixes the name.
 */
export function resolveTool(name: unknown, servers: MCPServer[] = MCP_SERVERS): { server: MCPServer; toolName: string } | null {
  if (typeof name !== "string") return null;
  const server = servers
    .filter((candidate) => name.startsWith(`${candidate.id}_`))
    .sort((a, b) => b.id.length - a.id.length)[0];
  if (!server) return null;
  return { server, toolName: name.slice(server.id.length + 1) };
}

/** Short public summary of a server (no long description or tool schemas). */
export function serverSummary(server: MCPServer) {
  return { id: server.id, name: server.name, url: server.url, description: server.description, tags: server.tags ?? [] };
}
