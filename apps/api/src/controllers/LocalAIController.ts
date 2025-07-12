/**
 * Local AI Controller
 * Handles detection and registration of local AI providers as Agents
 */

import { Controller, Get, Post, Param, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentService } from '@the-new-fuse/api-core';
import { Agent } from '@the-new-fuse/api-core/src/modules/repositories/agent.repository';
import { LocalAIDetectionService, LocalAIProvider } from '@the-new-fuse/core';
import { AgentCapability } from '@the-new-fuse/types';

interface AuthenticatedRequest {
  user?: { id: string };
}

@ApiTags('local-ai')
@Controller('api/local-ai')
export class LocalAIController {
  private readonly logger = new Logger(LocalAIController.name);

  constructor(
    private agentService: AgentService,
    private localAIDetection: LocalAIDetectionService
  ) {}

  @Get('detect')
  @ApiOperation({ summary: 'Detect available local AI providers' })
  @ApiResponse({ status: 200, description: 'List of detected local AI providers' })
  async detectLocalAIs() {
    this.logger.log('🔍 API: Detecting local AI providers...');
    const providers = await this.localAIDetection.detectAvailableAIs();
    
    return {
      success: true,
      count: providers.length,
      providers: providers.map(p => ({
        name: p.name,
        description: p.description,
        capabilities: p.capabilities,
        command: p.command,
        apiEndpoint: p.apiEndpoint
      }))
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register detected local AIs as user agents' })
  @ApiResponse({ status: 201, description: 'Local AI agents registered successfully' })
  async registerLocalAIs(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.id || 'default';
    this.logger.log(`🚀 API: Registering local AIs for user: ${userId}`);
    
    const agents = await this.agentService.detectAndRegisterLocalAIs(userId);
    
    return {
      success: true,
      message: `Registered ${agents.length} local AI agents`,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        provider: (agent.configuration as any)?.provider,
        capabilities: agent.capabilities
      }))
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'Local AI agents refreshed successfully' })
  async refreshLocalAIs(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.id || 'default';
    this.logger.log(`🔄 API: Refreshing local AIs for user: ${userId}`);
    
    const agents = await this.agentService.refreshLocalAIAgents(userId);
    
    return {
      success: true,
      message: `Refreshed local AI agents`,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        provider: (agent.configuration as any)?.provider,
        status: agent.status
      }))
    };
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all local AI agents for current user' })
  @ApiResponse({ status: 200, description: 'List of local AI agents' })
  async getLocalAIAgents(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.id || 'default';
    this.logger.log(`📋 API: Getting local AI agents for user: ${userId}`);
    
    const agents = await this.agentService.getLocalAIAgents(userId);
    
    return {
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        provider: (agent.configuration as any)?.provider,
        capabilities: agent.capabilities,
        description: agent.description,
        createdAt: (agent as any).createdAt || new Date(),
        lastActive: agent.metadata?.lastActive
      }))
    };
  }

  @Get('agents/:agentId/status')
  @ApiOperation({ summary: 'Check status of a specific local AI agent' })
  @ApiResponse({ status: 200, description: 'Local AI agent status' })
  async getLocalAIAgentStatus(@Param('agentId') agentId: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.id || 'default';
    this.logger.log(`🔍 API: Checking status of agent ${agentId} for user: ${userId}`);
    
    const agent = await this.agentService.getAgentById(agentId, userId);
    
    if (!agent || !(agent.configuration as any)?.localAI) {
      return {
        success: false,
        message: 'Local AI agent not found'
      };
    }

    const config = agent.configuration as any;
    // Check if the underlying AI provider is still available
    const provider: LocalAIProvider = {
      name: config?.provider as string || 'unknown',
      command: config?.command as string || 'unknown',
      checkCommand: config?.command ? [config.command as string, '--version'] : ['echo', 'test'],
      description: agent.description || 'Local AI provider',
      capabilities: (agent.capabilities || []) as AgentCapability[]
    };

    const isAvailable = await this.localAIDetection.checkProviderAvailability(provider);

    return {
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        provider: config.provider,
        status: agent.status,
        available: isAvailable,
        lastChecked: new Date()
      }
    };
  }

  @Post('system/create-defaults')
  @ApiOperation({ summary: 'Create default system agents for all detected local AIs' })
  @ApiResponse({ status: 201, description: 'System local AI agents created successfully' })
  async createSystemAgents() {
    this.logger.log('🚀 API: Creating system local AI agents...');
    
    const agents = await this.agentService.createSystemLocalAIAgents();
    
    return {
      success: true,
      message: `Created ${agents.length} system local AI agents`,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        provider: (agent.configuration as any)?.provider,
        type: agent.type
      }))
    };
  }
}