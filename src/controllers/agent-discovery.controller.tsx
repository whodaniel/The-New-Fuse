import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AgentDiscoveryService } from '../services/agent-discovery.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AgentType } from '@prisma/client';

interface RegisterAgentDto {
  name: string;
  description: string;
  type: AgentType;
  userId: string;
  capabilities: string[];
  tools: Record<string, any>;
}

/**
 * Controller for agent discovery and registration
 */
@Controller('agent-discovery')
@UseGuards(JwtAuthGuard)
export class AgentDiscoveryController {
  constructor(private readonly agentDiscoveryService: AgentDiscoveryService) {}

  /**
   * Register a new agent
   */
  @Post('register')
  async registerAgent(@Body() dto: RegisterAgentDto) {
    return this.agentDiscoveryService.registerAgent(
      dto.name,
      dto.description,
      dto.type,
      dto.userId,
      dto.capabilities,
      dto.tools
    );
  }

  /**
   * Discover all MCP tools
   */
  @Get('tools')
  async discoverTools() {
    return this.agentDiscoveryService.discoverMCPTools();
  }

  /**
   * Discover all registered agents
   */
  @Get('agents')
  async discoverAgents() {
    return this.agentDiscoveryService.discoverAgents();
  }

  /**
   * Update agent tools
   */
  @Post('agents/:id/tools')
  async updateAgentTools(
    @Param('id') id: string,
    @Body() tools: Record<string, any>
  ) {
    return this.agentDiscoveryService.updateAgentTools(id, tools);
  }
}
