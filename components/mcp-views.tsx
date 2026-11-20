import Link from "next/link";
import {
  ArticleHeader,
  EmptyState,
  EntryList,
  Pager,
  Prose,
  Reader,
  ReaderFoot,
  ReaderHead,
  ReaderTop,
  ResultCount,
  SearchForm,
  TagFilter,
  neighbours,
  plural,
  type Entry,
} from "@/components/reader-shell";
import { Markdown } from "@/lib/markdown";
import { filterServers, tagOptions } from "@/lib/mcp-hub";
import type { MCPServer } from "@/lib/mcp-servers";

export const SITE = "https://mcplist.bookchaowalit.com";
const SOURCE = "https://github.com/bookchaowalit-website/devtools-mcplist-web";
const NOTE = "A curated list kept in the repository. It does not check uptime, ownership or third-party behaviour.";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Reader>
      <ReaderTop name="MCP List" tagline="Model Context Protocol servers" links={[{ href: "/api/mcp", label: "MCP endpoint" }]} />
      <main id="main" className="rs-main">{children}</main>
      <ReaderFoot source={SOURCE} note={NOTE} />
    </Reader>
  );
}

function toEntry(server: MCPServer): Entry {
  return {
    href: "/mcp/" + server.id,
    title: server.name,
    summary: server.description,
    meta: [plural(server.tools?.length ?? 0, "tool"), ...(server.version ? ["v" + server.version] : [])],
    tags: (server.tags ?? []).slice(0, 4),
  };
}

export function HomeView({ servers, query = "", tag = "" }: { servers: MCPServer[]; query?: string; tag?: string }) {
  // Filters accept the first seven tags the registry really has, never a raw URL value. Only five are chips,
  // which keeps the first server row inside the first phone screen; the rest are links under the list, and
  // a selected one joins the chips so the active filter stays visible.
  const allTags = tagOptions(servers, 7).slice(1);
  const activeTag = allTags.includes(tag) ? tag : "";
  const chipTags = allTags.slice(0, 5);
  const moreTags = allTags.slice(5);
  const tags = activeTag && !chipTags.includes(activeTag) ? [...chipTags, activeTag] : chipTags;
  const matching = filterServers(servers, "All", query);
  const shown = activeTag ? matching.filter((s) => (s.tags ?? []).includes(activeTag)) : matching;
  const href = (t: string, q = query) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (t) params.set("tag", t);
    const text = params.toString();
    return "/" + (text ? "?" + text : "");
  };

  return (
    <Frame>
      <ReaderHead
        eyebrow="Model Context Protocol directory"
        title="Find the tool behind the protocol."
        lede="A curated list of MCP servers. Read what each one does, inspect its tools and their input schemas, then decide what belongs in your stack."
      />
      <section aria-labelledby="servers-title">
        <div className="rs-section-head">
          <h2 id="servers-title">Servers</h2>
        </div>
        <div className="rs-toolbar">
          <SearchForm label="Search servers" action="/" placeholder="Name, description or tag" defaultValue={query} hidden={activeTag ? { tag: activeTag } : {}} clearHref={href(activeTag, "")} />
          <TagFilter
            label="Filter by tag"
            options={[
              { href: href(""), label: "All", current: !activeTag, count: matching.length },
              ...tags.map((t) => ({ href: href(t), label: t, current: t === activeTag, count: matching.filter((s) => (s.tags ?? []).includes(t)).length })),
            ]}
          />
          <ResultCount shown={shown.length} total={servers.length} noun="server" query={query || undefined} filter={activeTag || undefined} />
        </div>
        {shown.length ? (
          <EntryList entries={shown.map(toEntry)} headingLevel={3} />
        ) : servers.length ? (
          <EmptyState title="No server matches" headingLevel={3} action={<Link className="rs-plain" href="/">Show all servers</Link>}>
            Nothing matches {query ? <>“{query}”</> : "this tag"}{activeTag && query ? <> under {activeTag}</> : null}. Try a shorter word or another tag.
          </EmptyState>
        ) : (
          <EmptyState title="No servers yet" headingLevel={3}>Servers appear here once they are added to the registry.</EmptyState>
        )}
        {moreTags.length ? (
          <p className="mc-more-tags">
            More tags:{" "}
            {moreTags.map((t, i) => (
              <span key={t}>
                {i > 0 ? " · " : null}
                <a href={href(t)} className="mc-link" aria-current={t === activeTag ? "page" : undefined}>{t}</a>
              </span>
            ))}
          </p>
        ) : null}
      </section>
      <section aria-labelledby="endpoint-title" className="rs-measure">
        <div className="rs-section-head"><h2 id="endpoint-title">Read before connecting</h2></div>
        <p className="rs-lede">
          This directory is curated local data: it does not verify uptime, ownership or third-party behaviour. The site also answers MCP itself at{" "}
          <a href="/api/mcp" className="mc-link">/api/mcp</a>.
        </p>
      </section>
    </Frame>
  );
}

export function DetailView({ server, all }: { server: MCPServer; all: MCPServer[] }) {
  const { previous, next } = neighbours(all, all.findIndex((s) => s.id === server.id));
  const tools = server.tools ?? [];
  return (
    <Frame>
      <article className="rs-article">
        <ArticleHeader
          back={{ href: "/", label: "All servers" }}
          tags={server.tags ?? []}
          title={server.name}
          lede={server.description}
          meta={[plural(tools.length, "tool"), "Version " + (server.version || "unspecified"), "Author " + (server.author || "unspecified")]}
        />
        <Prose>
          <p>
            <a href={server.url} rel="noreferrer">Visit the declared URL</a> <span className="mc-url">({server.url.replace(/^https?:\/\//, "")})</span>
          </p>
          {server.longDescription ? (
            <>
              <h2 id="about">About</h2>
              <Markdown source={server.longDescription} />
            </>
          ) : null}
          <h2 id="tools">Tools</h2>
          {tools.length ? (
            tools.map((tool) => (
              <section key={tool.name} aria-labelledby={"tool-" + tool.name}>
                <h3 id={"tool-" + tool.name}><code>{tool.name}</code></h3>
                <p>{tool.description}</p>
                {tool.inputSchema ? (
                  <pre tabIndex={0} aria-label={"Input schema for " + tool.name}><code>{JSON.stringify(tool.inputSchema, null, 2)}</code></pre>
                ) : null}
              </section>
            ))
          ) : (
            <p>This server lists no tools.</p>
          )}
          <p className="mc-boundary">Listed from the local registry. No live health check is performed.</p>
        </Prose>
        <Pager
          label="More servers"
          previous={previous ? { href: "/mcp/" + previous.id, title: previous.name } : undefined}
          next={next ? { href: "/mcp/" + next.id, title: next.name } : undefined}
        />
      </article>
    </Frame>
  );
}

export function NotFoundView() {
  return (
    <Frame>
      <ReaderHead title="Server not found" lede="No server in the list has that id. It may have been renamed or removed.">
        <Link className="rs-button" href="/">Back to all servers</Link>
      </ReaderHead>
    </Frame>
  );
}
