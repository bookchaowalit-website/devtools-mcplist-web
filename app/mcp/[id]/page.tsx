import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/mcp-views";
import { MCP_SERVERS, getMCPServerById } from "@/lib/mcp-servers";

export function generateStaticParams() {
  return MCP_SERVERS.map((server) => ({ id: server.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const server = getMCPServerById((await params).id);
  if (!server) return {};
  return { title: server.name, description: server.description, alternates: { canonical: "/mcp/" + server.id } };
}

export default async function MCPServerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getMCPServerById(id);
  if (!server) notFound();
  return <DetailView server={server} all={MCP_SERVERS} />;
}
