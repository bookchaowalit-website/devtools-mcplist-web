import type { MetadataRoute } from "next";
import { SITE } from "@/components/mcp-views";
import { MCP_SERVERS } from "@/lib/mcp-servers";

export default function sitemap(): MetadataRoute.Sitemap {
  return [SITE + "/", ...MCP_SERVERS.map((s) => SITE + "/mcp/" + s.id)].map((url) => ({ url }));
}
