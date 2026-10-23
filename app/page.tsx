"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MCP_SERVERS } from "@/lib/mcp-servers";
import { filterServers, tagOptions } from "@/lib/mcp-hub";

const TAGS = tagOptions(MCP_SERVERS);

export default function Home() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const visible = useMemo(() => filterServers(MCP_SERVERS, tag, query), [query, tag]);

  return (
    <main className="atlas-shell">
      <header className="atlas-topbar"><Link href="/" className="atlas-mark">MCP / ATLAS</Link><span>curated protocol directory</span><span>{MCP_SERVERS.length} registered servers</span></header>
      <section className="atlas-hero"><div><h1>Find the tool<br /><em>behind the protocol.</em></h1><p>A field directory for Model Context Protocol servers. Read the contract, inspect the tools, then decide what belongs in your stack.</p></div><div className="atlas-orbit" aria-hidden="true"><i /><i /><i /><b>MCP<br />FIELD<br />NOTE</b></div></section>
      <section className="atlas-controls"><label><span>⌕</span><input aria-label="Search MCP servers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search servers or tags" /></label><div>{TAGS.map((item) => <button key={item} className={tag === item ? "active" : ""} onClick={() => setTag(item)}>{item}</button>)}</div></section>
      <section className="atlas-index"><div className="atlas-index-head"><span>server / {String(visible.length).padStart(2, "0")}</span><span>tools</span><span>open</span></div>{visible.map((server, index) => <Link href={`/mcp/${server.id}`} className="server-row" key={server.id}><span className="server-number">{String(index + 1).padStart(2, "0")}</span><span className="server-name"><strong>{server.name}</strong><small>{server.description}</small><i>{(server.tags || []).slice(0, 3).join(" · ")}</i></span><span className="server-tools">{server.tools?.length || 0} tools</span><span className="server-open">↗</span></Link>)}{visible.length === 0 && <div className="atlas-empty">No server matches that field note.</div>}</section>
      <section className="atlas-boundary"><span>READ BEFORE CONNECTING</span><p>This directory is curated local data. It does not verify uptime, ownership, or third-party behavior.</p><a href="/api/mcp">Inspect the MCP endpoint ↗</a></section>
      <footer className="atlas-footer"><span>BOOKCHAOWALIT / MCP LIST</span><span>DISCOVERY FIRST · INTEGRATION SECOND</span></footer>
    </main>
  );
}
