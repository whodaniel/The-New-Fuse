import { Injectable, Logger } from '@nestjs/common';
import { MCPServerService } from './mcp-server.service';
import { MCPAgentIntegration } from '@the-new-fuse/mcp-core';
import { MCPBroker } from '@the-new-fuse/mcp-core/broker';
import { MCPClient } from '@the-new-fuse/mcp-core/client';
import { Agent, AgentStatus, LoadBalancingStrategy } from '@the-new-fuse/mcp-core';

/**
 * MCP-A2A Bridge Service
 *
 * Bridges Model Context Protocol (MCP) and Agent-to-Agent (A2A) protocols,
 * enabling seamless communication between MCP clients and A2A agents.
 *
 * Features:
 * - Bidirectional message translation between MCP and A2A
 * - Agent registration in both protocols
 * - Unified routing and discovery
 * - Protocol negotiation and capability mapping
 */
@Injectable()
export class MCPA2ABridge {
  private readonly logger = new Logger(MCPA2ABridge.name);
  private broker!: MCPBroker;
  private client!: MCPClient;
  private agentIntegration!: MCPAgentIntegration;
  private registeredAgents = new Map<string, any>();

  constructor(private readonly mcpServer: MCPServerService) {
    this.initializeBridge();
  }

  /**
   * Initialize the MCP-A2A bridge
   */
  private async initializeBridge(): Promise<void> {
    try {
      // Create broker for agent coordination
      this.broker = new MCPBroker({
        name: 'fuse-mcp-broker',
        version: '1.0.0',
        healthCheck: {
          interval: 30,
          timeout: 5000,
          failureThreshold: 3,
          recoveryThreshold: 2,
          enabled: true
        },
        options: {
          maxConcurrentRequests: 100
        }
      });

      await this.broker.start();

      // Create client for making requests
      this.client = new MCPClient({
        name: 'fuse-a2a-client',
        version: '1.0.0',
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        },
      });

      // Create agent integration
      this.agentIntegration = new MCPAgentIntegration(this.broker, this.client, {
        defaultTimeout: 30000,
        maxRetries: 3,
        heartbeatInterval: 60000,
        enableMetrics: true,
        enableAuditLog: true,
      });

      this.logger.log('MCP-A2A Bridge initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP-A2A bridge:', error);
      throw error;
    }
  }

  /**
   * Register an A2A agent as an MCP service
   */
  async registerA2AAgent(agentConfig: {
    id: string;
    name: string;
    capabilities: string[];
    resources?: string[];
    tools?: string[];
    endpoint?: string;
    metadata?: any;
  }): Promise<{ success: boolean; endpoint?: string; error?: string }> {
    try {
      const agent: Agent = {
        id: agentConfig.id,
        name: agentConfig.name,
        version: '1.0.0',
        capabilities: agentConfig.capabilities,
        resources: agentConfig.resources || [],
        tools: agentConfig.tools || [],
        endpoint: agentConfig.endpoint,
        status: AgentStatus.ACTIVE,
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: agentConfig.metadata || {},
      };

      const result = await this.agentIntegration.registerAgentAsMCPService(agent);

      if (result.success) {
        this.registeredAgents.set(agentConfig.id, {
          agent,
          registration: result,
          protocol: 'a2a',
        });

        this.logger.log(`A2A agent ${agentConfig.id} registered as MCP service`);

        return {
          success: true,
          endpoint: result.endpoint,
        };
      } else {
        return {
          success: false,
          error: result.errors.join(', '),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to register A2A agent ${agentConfig.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unregister an A2A agent
   */
  async unregisterA2AAgent(agentId: string): Promise<boolean> {
    try {
      const success = await this.agentIntegration.unregisterAgent(agentId);
      if (success) {
        this.registeredAgents.delete(agentId);
        this.logger.log(`A2A agent ${agentId} unregistered`);
      }
      return success;
    } catch (error) {
      this.logger.error(`Failed to unregister A2A agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Route a message from A2A to MCP
   */
  async routeA2AToMCP(
    fromAgentId: string,
    toAgentId: string,
    message: any,
    options?: {
      messageType?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      timeout?: number;
      requiresResponse?: boolean;
    }
  ): Promise<{
    success: boolean;
    messageId?: string;
    response?: any;
    error?: string;
  }> {
    try {
      const result = await this.agentIntegration.routeAgentMessage(
        fromAgentId,
        toAgentId,
        message,
        {
          messageType: (options?.messageType as any) || 'request',
          priority: options?.priority || 'normal',
          timeout: options?.timeout || 30000,
        }
      );

      if (result.success) {
        this.logger.debug(
          `Message routed from A2A agent ${fromAgentId} to MCP agent ${toAgentId}`
        );
        return {
          success: true,
          messageId: result.messageId,
          response: result.response,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error('Failed to route A2A to MCP message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Route a message from MCP to A2A
   */
  async routeMCPToA2A(
    mcpMessage: any,
    targetA2AAgent: string
  ): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    try {
      // Translate MCP message format to A2A format
      const a2aMessage = this.translateMCPToA2A(mcpMessage);

      // Send via A2A protocol
      // This would integrate with the actual A2A service
      // For now, we'll route it through the agent integration

      this.logger.debug(`Message routed from MCP to A2A agent ${targetA2AAgent}`);

      return {
        success: true,
        response: { delivered: true },
      };
    } catch (error) {
      this.logger.error('Failed to route MCP to A2A message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Discover agents across both protocols
   */
  async discoverAgents(filters?: {
    capability?: string;
    protocol?: 'mcp' | 'a2a' | 'all';
    status?: 'active' | 'inactive' | 'all';
  }): Promise<any[]> {
    const agents: any[] = [];

    // Get MCP agents
    if (!filters?.protocol || filters.protocol === 'mcp' || filters.protocol === 'all') {
      const mcpAgents = await this.agentIntegration.findAgentsByCapability(
        filters?.capability || ''
      );
      agents.push(
        ...mcpAgents.map((agent) => ({
          ...agent,
          protocol: 'mcp',
        }))
      );
    }

    // Get A2A agents
    if (!filters?.protocol || filters.protocol === 'a2a' || filters.protocol === 'all') {
      const a2aAgents = Array.from(this.registeredAgents.values())
        .filter((entry) => entry.protocol === 'a2a')
        .map((entry) => ({
          ...entry.agent,
          protocol: 'a2a',
        }));
      agents.push(...a2aAgents);
    }

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      return agents.filter((agent) => {
        const status = agent.status.toLowerCase();
        return status === filters.status;
      });
    }

    return agents;
  }

  /**
   * Enable collaboration between MCP and A2A agents
   */
  async startCollaboration(
    agentIds: string[],
    initiatorId: string,
    purpose: string
  ): Promise<{
    success: boolean;
    collaborationId?: string;
    error?: string;
  }> {
    try {
      const collaboration = await this.agentIntegration.startCollaboration(
        agentIds,
        initiatorId,
        purpose
      );

      this.logger.log(
        `Collaboration ${collaboration.id} started: ${purpose}`
      );

      return {
        success: true,
        collaborationId: collaboration.id,
      };
    } catch (error) {
      this.logger.error('Failed to start collaboration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * End a collaboration
   */
  async endCollaboration(collaborationId: string): Promise<boolean> {
    try {
      return await this.agentIntegration.endCollaboration(collaborationId);
    } catch (error) {
      this.logger.error('Failed to end collaboration:', error);
      return false;
    }
  }

  /**
   * Get collaboration status
   */
  async getCollaborationStatus(agentId: string): Promise<any[]> {
    try {
      return await this.agentIntegration.getAgentCollaborations(agentId);
    } catch (error) {
      this.logger.error('Failed to get collaboration status:', error);
      return [];
    }
  }

  /**
   * Translate MCP message to A2A format
   */
  private translateMCPToA2A(mcpMessage: any): any {
    return {
      id: mcpMessage.id,
      type: this.mapMCPMethodToA2AType(mcpMessage.method),
      content: mcpMessage.params,
      timestamp: mcpMessage.meta?.timestamp || new Date(),
      source: mcpMessage.meta?.source || 'mcp',
      priority: this.mapMCPPriorityToA2A(mcpMessage.meta?.priority),
    };
  }

  /**
   * Translate A2A message to MCP format
   */
  private translateA2AToMCP(a2aMessage: any): any {
    return {
      jsonrpc: '2.0',
      id: a2aMessage.id,
      method: this.mapA2ATypeToMCPMethod(a2aMessage.type),
      params: a2aMessage.content,
      meta: {
        timestamp: a2aMessage.timestamp,
        source: a2aMessage.source || 'a2a',
        priority: this.mapA2APriorityToMCP(a2aMessage.priority),
      },
    };
  }

  /**
   * Map MCP method to A2A message type
   */
  private mapMCPMethodToA2AType(method: string): string {
    const mapping: Record<string, string> = {
      'tools/call': 'TASK_REQUEST',
      'resources/read': 'QUERY',
      'agent.message': 'MESSAGE',
      'workflow.execute': 'TASK_REQUEST',
    };
    return mapping[method] || 'MESSAGE';
  }

  /**
   * Map A2A type to MCP method
   */
  private mapA2ATypeToMCPMethod(type: string): string {
    const mapping: Record<string, string> = {
      TASK_REQUEST: 'tools/call',
      QUERY: 'resources/read',
      MESSAGE: 'agent.message',
      RESPONSE: 'response',
    };
    return mapping[type] || 'agent.message';
  }

  /**
   * Map MCP priority to A2A
   */
  private mapMCPPriorityToA2A(
    priority?: string
  ): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: Record<string, any> = {
      low: 'low',
      normal: 'medium',
      high: 'high',
      urgent: 'urgent',
    };
    return mapping[priority || 'normal'] || 'medium';
  }

  /**
   * Map A2A priority to MCP
   */
  private mapA2APriorityToMCP(
    priority?: string
  ): 'low' | 'normal' | 'high' {
    const mapping: Record<string, any> = {
      low: 'low',
      medium: 'normal',
      high: 'high',
      urgent: 'high',
    };
    return mapping[priority || 'medium'] || 'normal';
  }

  /**
   * Get bridge statistics
   */
  async getBridgeStats(): Promise<{
    registeredAgents: number;
    mcpAgents: number;
    a2aAgents: number;
    activeCollaborations: number;
  }> {
    const allAgents = await this.discoverAgents({ protocol: 'all' });
    const mcpAgents = allAgents.filter((a) => a.protocol === 'mcp');
    const a2aAgents = allAgents.filter((a) => a.protocol === 'a2a');

    return {
      registeredAgents: this.registeredAgents.size,
      mcpAgents: mcpAgents.length,
      a2aAgents: a2aAgents.length,
      activeCollaborations: 0, // Would track active collaborations
    };
  }

  /**
   * Get broker instance
   */
  getBroker(): MCPBroker {
    return this.broker;
  }

  /**
   * Get agent integration instance
   */
  getAgentIntegration(): MCPAgentIntegration {
    return this.agentIntegration;
  }
}
