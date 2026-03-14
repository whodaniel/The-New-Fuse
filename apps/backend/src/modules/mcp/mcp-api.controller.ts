import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { db, sql } from '@the-new-fuse/database';
import type { MCPTool } from '@the-new-fuse/mcp-core';
import { MCPToolRegistry } from './mcp-tool-registry.service';

type McpParamType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface ApiMcpParameter {
  name: string;
  type: McpParamType;
  description: string;
  required?: boolean;
  default?: any;
}

interface ApiMcpTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ApiMcpParameter>;
  returns: {
    type: string;
    description: string;
  };
  serverId?: string;
}

interface ApiMcpServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  tools: ApiMcpTool[];
  metadata?: Record<string, any>;
}

@Controller('api/mcp')
export class McpApiController {
  private readonly logger = new Logger(McpApiController.name);

  constructor(private readonly toolRegistry: MCPToolRegistry) {}

  @Get('servers')
  async listServers(): Promise<{ servers: ApiMcpServer[] }> {
    const rows = await db.execute(sql`
      SELECT
        tnf_id,
        name,
        description,
        protocol,
        transport,
        command,
        endpoint_url,
        tools,
        status,
        scope,
        metadata
      FROM tnf_mcp_servers
      ORDER BY name ASC
    `);

    const serverRows = Array.isArray(rows) ? rows : ((rows as any)?.rows ?? []);

    const coreTools = this.toolRegistry.getAllTools().map((tool) => this.mapTool(tool, 'tnf-core'));

    const coreServer: ApiMcpServer = {
      id: 'tnf-core',
      name: 'TNF MCP Core',
      url: process.env.MCP_ENDPOINT_URL || '',
      status: 'online',
      tools: coreTools,
      metadata: {
        source: 'tnf-core',
        description: 'TNF built-in MCP server and tool registry',
      },
    };

    const curatedServers = serverRows.map((row: any) => {
      const toolNames = Array.isArray(row.tools) ? row.tools : [];
      const tools = toolNames.map((toolName) => {
        const tool = this.toolRegistry.getTool(toolName);
        if (tool) {
          return this.mapTool(tool, row.tnf_id);
        }
        return {
          id: toolName,
          name: toolName,
          description: '',
          parameters: {},
          returns: { type: 'object', description: '' },
          serverId: row.tnf_id,
        };
      });

      return {
        id: row.tnf_id || row.id || row.name,
        name: row.name,
        url: row.endpoint_url || row.command || '',
        status: this.mapStatus(row.status),
        tools,
        metadata: {
          source: 'tnf',
          description: row.description,
          protocol: row.protocol,
          transport: row.transport,
          scope: row.scope,
          command: row.command,
          endpointUrl: row.endpoint_url,
          ...((row.metadata as Record<string, any>) || {}),
        },
      } as ApiMcpServer;
    });

    return { servers: [coreServer, ...curatedServers] };
  }

  @Get('servers/:id/tools')
  async listServerTools(@Param('id') id: string): Promise<ApiMcpTool[]> {
    if (id === 'tnf-core') {
      return this.toolRegistry.getAllTools().map((tool) => this.mapTool(tool, id));
    }

    const rows = await db.execute(sql`
      SELECT tools, tnf_id
      FROM tnf_mcp_servers
      WHERE tnf_id = ${id}
      LIMIT 1
    `);
    const row = Array.isArray(rows) ? rows[0] : (rows as any)?.rows?.[0];
    const toolNames = Array.isArray(row?.tools) ? row.tools : [];
    return toolNames.map((toolName: string) => {
      const tool = this.toolRegistry.getTool(toolName);
      if (tool) {
        return this.mapTool(tool, id);
      }
      return {
        id: toolName,
        name: toolName,
        description: '',
        parameters: {},
        returns: { type: 'object', description: '' },
        serverId: id,
      };
    });
  }

  @Get('marketplace/servers')
  async listMarketplaceServers(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const normalizedLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
    const baseUrl = 'https://registry.modelcontextprotocol.io/v0.1/servers';
    const url = new URL(baseUrl);
    url.searchParams.set('limit', String(normalizedLimit));
    if (cursor) url.searchParams.set('cursor', cursor);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Registry request failed: ${response.status}`);
      }
      const payload = await response.json();
      const servers = Array.isArray(payload?.servers) ? payload.servers : [];

      return servers.map((serverName: string) => this.mapRegistryServer(serverName));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Official MCP registry unavailable: ${message}`);
      return [];
    }
  }

  private mapRegistryServer(serverName: string) {
    const name = String(serverName || '').trim();
    const publisher = name.includes('/') ? name.split('/')[0] : 'official-registry';
    return {
      id: name,
      name,
      description: 'Official MCP Registry listing',
      version: 'latest',
      publisher,
      category: 'registry',
      rating: 0,
      downloads: 0,
      lastUpdated: new Date().toISOString(),
      installCommand: '',
      args: [],
      capabilities: [],
      requiresConfiguration: false,
    };
  }

  private mapTool(tool: MCPTool, serverId: string): ApiMcpTool {
    const inputSchema: any = tool?.inputSchema || {};
    const properties: Record<string, any> = inputSchema.properties || {};
    const requiredSet = new Set(Array.isArray(inputSchema.required) ? inputSchema.required : []);

    const parameters = Object.entries(properties).reduce<Record<string, ApiMcpParameter>>(
      (acc, [name, config]) => {
        const rawType = Array.isArray(config?.type) ? config.type[0] : config?.type;
        const type = this.normalizeType(rawType);
        acc[name] = {
          name,
          type,
          description: config?.description || '',
          required: requiredSet.has(name),
          default: config?.default,
        };
        return acc;
      },
      {}
    );

    const outputSchema: any = tool?.outputSchema || {};
    const outputType = Array.isArray(outputSchema.type) ? outputSchema.type[0] : outputSchema.type;

    return {
      id: tool.name,
      name: tool.name,
      description: tool.description,
      parameters,
      returns: {
        type: outputType || 'object',
        description: outputSchema.description || 'Execution result',
      },
      serverId,
    };
  }

  private normalizeType(type?: string): McpParamType {
    switch (type) {
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }

  private mapStatus(status?: string): 'online' | 'offline' | 'error' {
    switch (status) {
      case 'available':
      case 'active':
      case 'online':
        return 'online';
      case 'offline':
      case 'inactive':
        return 'offline';
      default:
        return 'error';
    }
  }
}
