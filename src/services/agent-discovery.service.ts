import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service.js';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { AgentType, AgentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Service for discovering and registering agents
 * This implements the standard discovery protocol for all agents
 */
@Injectable()
export class AgentDiscoveryService {
  private readonly logger = new Logger(AgentDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mcpBroker: MCPBrokerService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Register a new agent with its tools
   */
  async registerAgent(
    name: string,
    description: string,
    type: AgentType,
    userId: string,
    capabilities: string[],
    tools: Record<string, any>
  ) {
    try {
      this.logger.log(`Registering agent: ${name}`);

      // Check if agent already exists
      const existingAgent = await this.prisma.agent.findFirst({
        where: {
          name
        }
      });

      if (existingAgent) {
        this.logger.log(`Agent ${name} already registered with ID: ${existingAgent.id}`);
        return existingAgent;
      }

      // Register agent in database
      const agent = await this.prisma.agent.create({
        data: {
          name,
          description,
          type,
          status: AgentStatus.ACTIVE,
          userId,
          config: {
            capabilities,
            tools,
            metadata: {
              registrationDate: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            }
          }
        }
      });

      this.logger.log(`Successfully registered agent ${name} with ID: ${agent.id}`);

      // Create metrics entry for the agent
      await this.prisma.codeMetrics.create({
        data: {
          agentId: agent.id,
          linesOfCode: 0,
          tokensUsed: 0
        }
      });

      // Emit agent registered event
      this.eventEmitter.emit('agent.registered', { agent });

      return agent;
    } catch (error) {
      this.logger.error(`Error registering agent ${name}:`, error);
      throw error;
    }
  }

  /**
   * Discover all available MCP tools
   */
  async discoverMCPTools() {
    try {
      this.logger.log('Discovering MCP tools...');

      // Get all tools from MCP Broker
      const allTools = this.mcpBroker.getAllTools();

      // Transform tools into a structured format
      const structuredTools: Record<string, any> = {};

      for (const [serverName, tools] of Object.entries(allTools)) {
        structuredTools[serverName] = Object.entries(tools).map(([toolName, tool]) => ({
          name: toolName,
          description: tool.description,
          parameters: tool.parameters,
          capabilities: this.inferCapabilitiesFromTool(toolName, tool.description)
        }));
      }

      this.logger.log(`Discovered ${Object.keys(structuredTools).length} MCP tool categories`);
      return structuredTools;
    } catch (error) {
      this.logger.error('Error discovering MCP tools:', error);
      throw error;
    }
  }

  /**
   * Discover all registered agents
   */
  async discoverAgents() {
    try {
      this.logger.log('Discovering registered agents...');

      const agents = await this.prisma.agent.findMany({
        where: {
          status: AgentStatus.ACTIVE
        },
        include: {
          metrics: true
        }
      });

      this.logger.log(`Discovered ${agents.length} registered agents`);
      return agents;
    } catch (error) {
      this.logger.error('Error discovering agents:', error);
      throw error;
    }
  }

  /**
   * Update agent tools
   */
  async updateAgentTools(agentId: string, tools: Record<string, any>) {
    try {
      this.logger.log(`Updating tools for agent ${agentId}`);

      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }

      // Update agent config with new tools
      const config = agent.config as Record<string, any> || {};
      config.tools = tools;
      config.metadata = {
        ...config.metadata,
        lastUpdated: new Date().toISOString()
      };

      await this.prisma.agent.update({
        where: { id: agentId },
        data: { config }
      });

      this.logger.log(`Updated tools for agent ${agentId}`);

      // Emit agent tools updated event
      this.eventEmitter.emit('agent.tools.updated', { agentId, tools });

      return true;
    } catch (error) {
      this.logger.error(`Error updating tools for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Infer capabilities from tool name and description
   */
  private inferCapabilitiesFromTool(name: string, description: string): string[] {
    const capabilities: string[] = [];
    const lowerName = name.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // Code-related capabilities
    if (lowerName.includes('code') || lowerDesc.includes('code')) {
      capabilities.push('code_manipulation');
    }
    if (lowerName.includes('file') || lowerDesc.includes('file')) {
      capabilities.push('file_manipulation');
    }
    if (lowerName.includes('search') || lowerDesc.includes('search')) {
      capabilities.push('search');
    }
    if (lowerName.includes('web') || lowerDesc.includes('web')) {
      capabilities.push('web_access');
    }
    if (lowerName.includes('process') || lowerDesc.includes('process')) {
      capabilities.push('process_management');
    }
    if (lowerName.includes('database') || lowerDesc.includes('database')) {
      capabilities.push('database_access');
    }
    if (lowerName.includes('api') || lowerDesc.includes('api')) {
      capabilities.push('api_access');
    }

    // If no capabilities were inferred, add a generic one
    if (capabilities.length === 0) {
      capabilities.push('tool_usage');
    }

    return capabilities;
  }
}
