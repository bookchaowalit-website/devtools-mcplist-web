import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import MCPServerPage, { generateMetadata, generateStaticParams } from "@/app/mcp/[id]/page";
import NotFound from "@/app/mcp/[id]/not-found";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { HomeView } from "@/components/mcp-views";
import { Markdown, parseBlocks } from "@/lib/markdown";
import { MCP_SERVERS } from "@/lib/mcp-servers";
import nextConfig from "@/next.config";

const home = async (params: Record<string, string | string[]> = {}) => renderToString(await Home({ searchParams: Promise.resolve(params) }));

describe("home page", () => {
  it("lists every registered server with one h1, a count, tag chips and the curated-data notice", async () => {
    const html = await home();
    expect(html).toContain("Find the tool behind the protocol.");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`${MCP_SERVERS.length} servers`);
    for (const server of MCP_SERVERS) expect(html).toContain(`href="/mcp/${server.id}"`);
    expect(html).toContain("it does not verify uptime, ownership or third-party behaviour");
    expect(html).toContain('aria-label="Filter by tag"');
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("searches and filters by a real tag, and keeps the query on chips", async () => {
    const tag = MCP_SERVERS[0].tags![0];
    const html = await home({ q: "blog", tag });
    expect(html).toContain(`in ${tag} for “blog”`);
    expect(html).toContain('href="/?q=blog"');
    expect(html).toContain(`href="/?tag=${encodeURIComponent(tag)}">Clear`);
  });

  it("ignores a tag the registry does not have and offers a way back when nothing matches", async () => {
    const html = await home({ q: ["zzzz-nothing"], tag: "<script>" });
    expect(html).toContain("No server matches");
    expect(html).toContain("Show all servers");
    expect(html).not.toContain("&lt;script&gt;");
    const tagged = renderToString(<HomeView servers={MCP_SERVERS} query="zzzz" tag={MCP_SERVERS[0].tags![0]} />);
    expect(tagged).toMatch(/under/);
    expect(renderToString(<HomeView servers={[]} />)).toContain("No servers yet");
  });
});

describe("server detail page", () => {
  it("renders a server's tools, its long description as Markdown and the no-health-check boundary", async () => {
    const html = renderToString(await MCPServerPage({ params: Promise.resolve({ id: "bookchaowalit" }) }));
    expect(html).toContain("fetch_content");
    expect(html).toContain("No live health check is performed.");
    expect(html).toContain("<h3>Features</h3>");
    expect(html).not.toContain("## Features");
    expect(html).toContain("<li>Fetch latest articles and blog posts</li>");
    expect(html).toContain('rel="next"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("prebuilds every server and gives each its own title", async () => {
    expect(generateStaticParams()).toHaveLength(MCP_SERVERS.length);
    expect((await generateMetadata({ params: Promise.resolve({ id: "artblog" }) })).alternates?.canonical).toBe("/mcp/artblog");
    expect(await generateMetadata({ params: Promise.resolve({ id: "nope" }) })).toEqual({});
  });

  it("calls notFound for an unknown id, and the 404 uses the shell", async () => {
    await expect(MCPServerPage({ params: Promise.resolve({ id: "nope" }) })).rejects.toThrow();
    const html = renderToString(<NotFound />);
    expect(html).toContain("Server not found");
    expect(html).toContain("rs-foot");
  });
});

describe("markdown", () => {
  it("renders headings, lists, inline code and emphasis, and shows HTML as text", () => {
    expect(parseBlocks("# T\nline one\nline two\n\n- a\n* b")).toEqual([
      { kind: "h", level: 1, text: "T" },
      { kind: "p", lines: ["line one", "line two"] },
      { kind: "ul", items: ["a", "b"] },
    ]);
    const html = renderToString(<Markdown source={"**bold** `code` *em* <b>x</b>\n\n###### deep"} />);
    expect(html).toContain("<strong>bold</strong> <code>code</code> <em>em</em> &lt;b&gt;x&lt;/b&gt;");
    expect(html).toContain("<h6>deep</h6>");
  });
});

describe("site", () => {
  it("redirects /more-projects to the hub and publishes sitemap and robots on its own domain", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
    expect(sitemap().map((e) => e.url)).toContain("https://mcplist.bookchaowalit.com/mcp/artblog");
    expect(robots().sitemap).toBe("https://mcplist.bookchaowalit.com/sitemap.xml");
  });
});
