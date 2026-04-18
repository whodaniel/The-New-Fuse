import { Body, Controller, Delete, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard.js';
import { MCPA2ABridge } from './mcp-a2a-bridge.service.js';
import { MCPServerService } from './mcp-server.service.js';
import { MCPToolRegistry } from './mcp-tool-registry.service.js';

interface McpServerConfig {
  name: string;
  description?: string;
  transport: 'stdio' | 'sse';
  port?: number;
  url?: string;
  authRequired: boolean;
}

interface McpClientConfig {
  serverUrl: string;
  transport: 'stdio' | 'sse';
  timeout?: number;
  authKey?: string;
}

/**
 * Admin MCP Controller
 *
 * Admin-only endpoints for managing MCP servers and clients.
 * All endpoints require admin authentication.
 */
@Controller('admin/mcp')
@UseGuards(AdminGuard)
export class AdminMCPController {
  private readonly logger = new Logger(AdminMCPController.name);

  // In-memory storage for servers/clients (would be database in production)
  private servers: Map<string, McpServerConfig & { id: string; status: string }> = new Map();
  private clients: Map<string, McpClientConfig & { id: string; status: string }> = new Map();

  constructor(
    private readonly mcpServer: MCPServerService,
    private readonly toolRegistry: MCPToolRegistry,
    private readonly bridge: MCPA2ABridge
  ) {}

  // ==================== SERVER MANAGEMENT ====================

  /**
   * List all MCP servers
   */
  @Get('servers')
  async listServers() {
    const servers = Array.from(this.servers.values());
    const status: Record<string, string> = {};
    servers.forEach((s) => {
      status[s.id] = s.status;
    });

    return { servers, status };
  }

  /**
   * Get server status
   */
  @Get('servers/status')
  async getServersStatus() {
    const status: Record<string, string> = {};
    this.servers.forEach((server, id) => {
      status[id] = server.status;
    });
    return status;
  }

  /**
   * Create a new MCP server
   */
  @Post('servers')
  async createServer(@Body() config: McpServerConfig) {
    const id = `mcp-server-${Date.now()}`;
    const server = {
      id,
      ...config,
      status: 'stopped',
    };
    this.servers.set(id, server);
    this.logger.log(`Created MCP server: ${id}`);
    return { success: true, server };
  }

  /**
   * Get server by ID
   */
  @Get('servers/:id')
  async getServer(@Param('id') id: string) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }
    return server;
  }

  /**
   * Delete a server
   */
  @Delete('servers/:id')
  async deleteServer(@Param('id') id: string) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    if (server.status === 'running') {
      await this.stopServer(id);
    }

    this.servers.delete(id);
    this.logger.log(`Deleted MCP server: ${id}`);
    return { success: true, id };
  }

  /**
   * Start a server
   */
  @Post('servers/:id/start')
  async startServer(@Param('id') id: string) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    server.status = 'running';
    this.servers.set(id, server);
    this.logger.log(`Started MCP server: ${id}`);
    return { success: true, id, status: 'running' };
  }

  /**
   * Stop a server
   */
  @Post('servers/:id/stop')
  async stopServer(@Param('id') id: string) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    server.status = 'stopped';
    this.servers.set(id, server);
    this.logger.log(`Stopped MCP server: ${id}`);
    return { success: true, id, status: 'stopped' };
  }

  /**
   * Register a tool on a server
   */
  @Post('servers/:id/tools')
  async registerTool(@Param('id') id: string, @Body() tool: any) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    // Register tool in the tool registry
    const toolDefinition: any = {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? tool.inputSchema ?? {},
      handler: async (params: any) => ({ result: 'Tool executed', params }),
    };
    this.toolRegistry.registerTool(toolDefinition);

    this.logger.log(`Registered tool ${tool.name} on server ${id}`);
    return { success: true, tool };
  }

  /**
   * Register a resource on a server
   */
  @Post('servers/:id/resources')
  async registerResource(@Param('id') id: string, @Body() resource: any) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    this.logger.log(`Registered resource ${resource.uri} on server ${id}`);
    return { success: true, resource };
  }

  /**
   * Register a prompt on a server
   */
  @Post('servers/:id/prompts')
  async registerPrompt(@Param('id') id: string, @Body() prompt: any) {
    const server = this.servers.get(id);
    if (!server) {
      return { error: 'Server not found', id };
    }

    this.logger.log(`Registered prompt ${prompt.name} on server ${id}`);
    return { success: true, prompt };
  }

  // ==================== CLIENT MANAGEMENT ====================

  /**
   * List all MCP clients
   */
  @Get('clients')
  async listClients() {
    const clients = Array.from(this.clients.values());
    const status: Record<string, string> = {};
    clients.forEach((c) => {
      status[c.id] = c.status;
    });

    return { clients, status };
  }

  /**
   * Get client status
   */
  @Get('clients/status')
  async getClientsStatus() {
    const status: Record<string, string> = {};
    this.clients.forEach((client, id) => {
      status[id] = client.status;
    });
    return status;
  }

  /**
   * Create a new MCP client
   */
  @Post('clients')
  async createClient(@Body() config: McpClientConfig) {
    const id = `mcp-client-${Date.now()}`;
    const client = {
      id,
      ...config,
      status: 'disconnected',
    };
    this.clients.set(id, client);
    this.logger.log(`Created MCP client: ${id}`);
    return { success: true, client };
  }

  /**
   * Get client by ID
   */
  @Get('clients/:id')
  async getClient(@Param('id') id: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }
    return client;
  }

  /**
   * Delete a client
   */
  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    if (client.status === 'connected') {
      await this.disconnectClient(id);
    }

    this.clients.delete(id);
    this.logger.log(`Deleted MCP client: ${id}`);
    return { success: true, id };
  }

  /**
   * Connect a client
   */
  @Post('clients/:id/connect')
  async connectClient(@Param('id') id: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    client.status = 'connected';
    this.clients.set(id, client);
    this.logger.log(`Connected MCP client: ${id}`);
    return { success: true, id, status: 'connected' };
  }

  /**
   * Disconnect a client
   */
  @Post('clients/:id/disconnect')
  async disconnectClient(@Param('id') id: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    client.status = 'disconnected';
    this.clients.set(id, client);
    this.logger.log(`Disconnected MCP client: ${id}`);
    return { success: true, id, status: 'disconnected' };
  }

  /**
   * Discover client capabilities
   */
  @Get('clients/:id/capabilities')
  async discoverCapabilities(@Param('id') id: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    // Return capabilities from the tool registry
    const tools = this.toolRegistry.getAllTools();

    return {
      server: {
        id: client.id,
        name: `Client ${id}`,
        version: '1.0.0',
        description: 'MCP Client',
      },
      capabilities: tools.map((t: any) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    };
  }

  /**
   * Call a tool on a client
   */
  @Post('clients/:id/tools/:toolName')
  async callTool(
    @Param('id') id: string,
    @Param('toolName') toolName: string,
    @Body() params: any
  ) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      return { error: 'Tool not found', toolName };
    }

    try {
      const handler = (tool as any).handler as (input: any) => Promise<any> | any;
      const result = await handler(params);
      return { success: true, result };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get a resource from a client
   */
  @Get('clients/:id/resources/:uri')
  async getResource(@Param('id') id: string, @Param('uri') uri: string) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    // Placeholder for resource retrieval
    return {
      uri,
      content: 'Resource content placeholder',
      mimeType: 'text/plain',
    };
  }

  /**
   * Get a prompt from a client
   */
  @Post('clients/:id/prompts/:promptName')
  async getPrompt(
    @Param('id') id: string,
    @Param('promptName') promptName: string,
    @Body() params: any
  ) {
    const client = this.clients.get(id);
    if (!client) {
      return { error: 'Client not found', id };
    }

    // Placeholder for prompt generation
    return {
      name: promptName,
      template: 'Prompt template placeholder',
      params,
      result: `Generated prompt for ${promptName}`,
    };
  }
}
