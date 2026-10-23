import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import MCPServerPage from "@/app/mcp/[id]/page";
import { MCP_SERVERS } from "@/lib/mcp-servers";

describe("home page", () => {
  it("lists every registered server with the curated-data boundary notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Find the tool");
    expect(html).toMatch(new RegExp(`${MCP_SERVERS.length}(<!-- -->)? registered servers`));
    for (const server of MCP_SERVERS) expect(html).toContain(`href="/mcp/${server.id}"`);
    expect(html).toContain("It does not verify uptime, ownership, or third-party behavior.");
  });
});

describe("server detail page", () => {
  it("renders a server's tools and the no-health-check boundary", async () => {
    const html = renderToString(await MCPServerPage({ params: Promise.resolve({ id: "artblog" }) }));
    expect(html).toContain("get_art_posts");
    expect(html).toContain("no live health check performed");
  });

  it("calls notFound for an unknown id", async () => {
    await expect(MCPServerPage({ params: Promise.resolve({ id: "nope" }) })).rejects.toThrow();
  });
});
