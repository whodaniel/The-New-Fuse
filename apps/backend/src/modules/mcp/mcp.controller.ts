import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { db, sql } from '@the-new-fuse/database';
import { MCPA2ABridge } from './mcp-a2a-bridge.service';
import { MCPServerService } from './mcp-server.service';
import { MCPToolRegistry } from './mcp-tool-registry.service';

/**
 * MCP Controller
 *
 * HTTP endpoints for MCP server management and agent coordination.
 */
@Controller('mcp')
export class MCPController {
  private readonly logger = new Logger(MCPController.name);

  constructor(
    private readonly mcpServer: MCPServerService,
    private readonly toolRegistry: MCPToolRegistry,
    private readonly bridge: MCPA2ABridge
  ) {}

  /**
   * Get server status
   */
  @Get('status')
  async getStatus() {
    return this.mcpServer.getServerStatus();
  }

  /**
   * Get all available MCP servers including TNF internal and TNF database entities
   */
  @Get('servers')
  async getServers() {
    this.logger.log('Fetching MCP servers list...');

    // 1. Fetch TNF curated servers from database
    const result = await db.execute(sql`
      SELECT
        id, tnf_id, name, description, protocol,
        command, args, env, endpoint_url, tools, resources,
        status, scope, version, created_at, updated_at
      FROM tnf_mcp_servers
      ORDER BY name ASC
    `);

    let dbServers = [];
    if (Array.isArray(result)) {
      dbServers = result as any[];
    } else if (
      result &&
      typeof result === 'object' &&
      'rows' in result &&
      Array.isArray((result as any).rows)
    ) {
      dbServers = (result as any).rows as any[];
    }

    // Map DB rows to standard format
    const curatedServers = dbServers.map((row) => ({
      id: row.id,
      tnfId: row.tnf_id,
      name: row.name,
      description: row.description,
      protocol: row.protocol,
      command: row.command,
      args: row.args || [],
      env: row.env || {},
      endpointUrl: row.endpoint_url,
      tools: row.tools || [],
      resources: row.resources || [],
      status: row.status,
      scope: row.scope,
      version: row.version,
      source: 'tnf-curated',
      isInternal: false,
    }));

    // 2. Add the dynamic TNF Internal MCP server mapping MCPToolRegistry tools
    const internalTools = this.toolRegistry.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
    }));

    const tnfInternalServer = {
      id: 'tnf-internal-mcp',
      tnfId: 'sys-mcp-tnf-internal',
      name: 'TNF Internal Tools',
      description: 'Built-in tools provided directly by the TNF platform.',
      protocol: 'internal',
      status: 'active',
      scope: 'sys',
      source: 'tnf-internal',
      isInternal: true,
      tools: internalTools,
    };

    return {
      servers: [tnfInternalServer, ...curatedServers],
      total: curatedServers.length + 1,
    };
  }

  /**
   * List all available tools
   */
  @Get('tools')
  async listTools(@Query('group') group?: string) {
    if (group) {
      return {
        group,
        tools: this.toolRegistry.getToolsByGroup(group),
      };
    }

    return {
      tools: this.toolRegistry.getAllTools(),
      groups: this.toolRegistry.getToolGroups(),
      total: this.toolRegistry.getAllTools().length,
    };
  }

  /**
   * Get tool by name
   */
  @Get('tools/:name')
  async getTool(@Param('name') name: string) {
    const tool = this.toolRegistry.getTool(name);
    if (!tool) {
      return {
        error: 'Tool not found',
        name,
      };
    }
    return tool;
  }

  /**
   * Register an A2A agent
   */
  @Post('agents/register')
  async registerAgent(
    @Body()
    agentConfig: {
      id: string;
      name: string;
      capabilities: string[];
      resources?: string[];
      tools?: string[];
      endpoint?: string;
      metadata?: any;
    }
  ) {
    const result = await this.bridge.registerA2AAgent(agentConfig);
    return result;
  }

  /**
   * Unregister an agent
   */
  @Post('agents/:agentId/unregister')
  async unregisterAgent(@Param('agentId') agentId: string) {
    const success = await this.bridge.unregisterA2AAgent(agentId);
    return { success, agentId };
  }

  /**
   * Discover agents
   */
  @Get('agents/discover')
  async discoverAgents(
    @Query('capability') capability?: string,
    @Query('protocol') protocol?: 'mcp' | 'a2a' | 'all',
    @Query('status') status?: 'active' | 'inactive' | 'all'
  ) {
    const agents = await this.bridge.discoverAgents({
      capability,
      protocol,
      status,
    });
    return {
      agents,
      total: agents.length,
    };
  }

  /**
   * Send message between agents
   */
  @Post('agents/message')
  async sendMessage(
    @Body()
    messageData: {
      from: string;
      to: string;
      message: any;
      messageType?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      timeout?: number;
    }
  ) {
    const result = await this.bridge.routeA2AToMCP(
      messageData.from,
      messageData.to,
      messageData.message,
      {
        messageType: messageData.messageType,
        priority: messageData.priority,
        timeout: messageData.timeout,
      }
    );
    return result;
  }

  /**
   * Start a collaboration
   */
  @Post('collaborations/start')
  async startCollaboration(
    @Body()
    collabData: {
      agentIds: string[];
      initiatorId: string;
      purpose: string;
    }
  ) {
    const result = await this.bridge.startCollaboration(
      collabData.agentIds,
      collabData.initiatorId,
      collabData.purpose
    );
    return result;
  }

  /**
   * End a collaboration
   */
  @Post('collaborations/:id/end')
  async endCollaboration(@Param('id') collaborationId: string) {
    const success = await this.bridge.endCollaboration(collaborationId);
    return { success, collaborationId };
  }

  /**
   * Get agent collaborations
   */
  @Get('agents/:agentId/collaborations')
  async getAgentCollaborations(@Param('agentId') agentId: string) {
    const collaborations = await this.bridge.getCollaborationStatus(agentId);
    return {
      agentId,
      collaborations,
      total: collaborations.length,
    };
  }

  /**
   * Get bridge statistics
   */
  @Get('bridge/stats')
  async getBridgeStats() {
    return this.bridge.getBridgeStats();
  }

  /**
   * Get tool groups
   */
  @Get('groups')
  async getToolGroups() {
    return {
      groups: this.toolRegistry.getToolGroups(),
    };
  }
}
