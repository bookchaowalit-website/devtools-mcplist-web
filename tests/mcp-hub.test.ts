import { describe, expect, it } from "vitest";
import { filterServers, listHubTools, resolveTool, serversWithTags, tagOptions } from "@/lib/mcp-hub";
import { MCP_SERVERS, type MCPServer } from "@/lib/mcp-servers";

const FIXTURE: MCPServer[] = [
  { id: "a", name: "Alpha Notes", url: "https://a.example", description: "Blog posts", tags: ["blog", "content"], tools: [{ name: "get_posts", description: "Posts" }] },
  { id: "a-b", name: "Beta", url: "https://ab.example", description: "Snippets store", tags: ["code"], tools: [] },
  { id: "c", name: "Gamma", url: "https://c.example", description: "No tags here" },
];

describe("filterServers", () => {
  it("matches name, description or tags, ignoring case and surrounding spaces", () => {
    expect(filterServers(FIXTURE, "All", "  ALPHA ").map((s) => s.id)).toEqual(["a"]);
    expect(filterServers(FIXTURE, "All", "snippets").map((s) => s.id)).toEqual(["a-b"]);
    expect(filterServers(FIXTURE, "All", "code").map((s) => s.id)).toEqual(["a-b"]);
  });

  it("combines the tag filter with the query, and copes with servers without tags", () => {
    expect(filterServers(FIXTURE, "blog", "").map((s) => s.id)).toEqual(["a"]);
    expect(filterServers(FIXTURE, "blog", "beta")).toEqual([]);
    expect(filterServers(FIXTURE, "All", "").length).toBe(3);
  });
});

describe("tagOptions", () => {
  it("starts with All, keeps registry order, dedupes and caps", () => {
    expect(tagOptions(FIXTURE)).toEqual(["All", "blog", "content", "code"]);
    expect(tagOptions(FIXTURE, 1)).toEqual(["All", "blog"]);
  });
});

describe("serversWithTags", () => {
  it("needs every tag, and returns all servers for no tags", () => {
    expect(serversWithTags(FIXTURE, ["blog", "content"]).map((s) => s.id)).toEqual(["a"]);
    expect(serversWithTags(FIXTURE, ["blog", "code"])).toEqual([]);
    expect(serversWithTags(FIXTURE, []).length).toBe(3);
  });
});

describe("resolveTool", () => {
  it("prefers the longest server id that prefixes the name", () => {
    expect(resolveTool("a-b_list", FIXTURE)).toMatchObject({ server: { id: "a-b" }, toolName: "list" });
    expect(resolveTool("a_get_posts", FIXTURE)).toMatchObject({ server: { id: "a" }, toolName: "get_posts" });
  });

  it("returns null for non-strings and unknown prefixes", () => {
    expect(resolveTool(42, FIXTURE)).toBeNull();
    expect(resolveTool("zzz_tool", FIXTURE)).toBeNull();
    expect(resolveTool("a", FIXTURE)).toBeNull();
  });
});

describe("listHubTools", () => {
  it("names tools <server>_<tool> and gives a default schema", () => {
    expect(listHubTools(FIXTURE)).toEqual([
      { name: "a_get_posts", description: "Posts (Alpha Notes)", inputSchema: { type: "object", properties: {} } },
    ]);
  });

  it("every real registry tool name resolves back to its own server", () => {
    for (const tool of listHubTools(MCP_SERVERS)) {
      const resolved = resolveTool(tool.name);
      expect(resolved && `${resolved.server.id}_${resolved.toolName}`).toBe(tool.name);
    }
  });
});
