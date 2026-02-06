import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
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
