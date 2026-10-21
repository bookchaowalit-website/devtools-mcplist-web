import { NextRequest, NextResponse } from 'next/server';
import { MCP_SERVERS } from '@/lib/mcp-servers';
import { forbiddenOrigin, isOriginAllowed, withCors } from '@/lib/cors';

// MCP Server implementation for Next.js API route
// This acts as a proxy/aggregator to other MCP servers

export const runtime = 'edge';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || !isOriginAllowed(origin)) return forbiddenOrigin();
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

// Handle GET requests - return server info
export async function GET(request: NextRequest) {
  return withCors(serverInfo(), request.headers.get('origin'));
}

function serverInfo() {
  return NextResponse.json({
    name: 'MCP List Hub',
    version: '1.0.0',
    description: 'MCP List Hub - Aggregator for MCP servers',
    endpoints: {
      mcp: '/api/mcp',
      documentation: '/',
      servers: MCP_SERVERS.length
    },
    usage: {
      method: 'POST',
      contentType: 'application/json',
      example: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize'
      }
    },
    availableMethods: ['initialize', 'tools/list', 'tools/call', 'servers/list']
  });
}

// Handle POST requests - MCP protocol
async function handleMCPRequest(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params, id } = body;

    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: 'mcplist-hub',
              version: '1.0.0',
              description: 'MCP List Hub - Aggregator for MCP servers'
            }
          }
        });

      case 'tools/list':
        const allTools = MCP_SERVERS.flatMap(server =>
          (server.tools || []).map(tool => ({
            name: `${server.id}_${tool.name}`,
            description: `${tool.description} (${server.name})`,
            inputSchema: tool.inputSchema || {
              type: 'object',
              properties: {
                server: { type: 'string', const: server.id },
                tool: { type: 'string', const: tool.name },
                params: { type: 'object' }
              }
            }
          }))
        );

        return NextResponse.json({
          jsonrpc: '2.0',
          id: id,
          result: { tools: allTools }
        });

      case 'tools/call':
        const { name, arguments: toolArgs } = params;
        const [serverId, toolName] = name.split('_');

        const targetServer = MCP_SERVERS.find(s => s.id === serverId);
        if (!targetServer) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32601,
              message: `Server ${serverId} not found`
            }
          });
        }

        // Proxy request to target MCP server
        const response = await fetch(`${targetServer.url}/api/mcp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: id,
            method: 'tools/call',
            params: { name: toolName, arguments: toolArgs }
          })
        });

        const result = await response.json();
        return NextResponse.json(result);

      case 'servers/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id,
          result: { servers: MCP_SERVERS.map(s => ({
            id: s.id,
            name: s.name,
            url: s.url,
            description: s.description
          })) }
        });

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
    }
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        detail: 'Invalid JSON-RPC request'
      }
    }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Reject before parsing so a foreign page cannot trigger a proxied call.
  if (!isOriginAllowed(origin)) return forbiddenOrigin();
  return withCors(await handleMCPRequest(request), origin);
}
