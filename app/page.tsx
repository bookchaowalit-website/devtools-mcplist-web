import { HomeView } from "@/components/mcp-views";
import { MCP_SERVERS } from "@/lib/mcp-servers";

type Search = { q?: string | string[]; tag?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  return <HomeView servers={MCP_SERVERS} query={first(params.q).trim().slice(0, 100)} tag={first(params.tag)} />;
}
