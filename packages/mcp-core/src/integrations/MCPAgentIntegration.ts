/**
 * MCP Agent Integration Implementation
 * 
 * This class provides the implementation for integrating agents with the MCP system,
 * enabling agent-to-agent communication through standardized MCP protocols.
 */

import type {
  IMCPAgentIntegration,
  Agent,
  AgentMCPEndpoint,
  AgentMessageRouting,
  AgentCollaboration,
  AgentCapabilityDiscovery,
  AgentRegistrationResult,
  AgentMessageResult,
  MCPCapability
} from '../interfaces/IMCPAgentIntegration';
import { AgentStatus } from '../interfaces/IMCPAgentIntegration';
import type { IMCPBroker } from '../interfaces/IMCPBroker';
import type { IMCPClient } from '../interfaces/IMCPClient';
import type { MCPServiceInfo } from '../types/broker';
import type { MCPMessage } from '../interfaces/IMCPMessage';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
import { ServiceStatus } from '../types/common';

/**
 * Configuration for MCP Agent Integration
 */
export interface MCPAgentIntegrationConfig {
  brokerEndpoint?: string;
  defaultTimeout: number;
  maxRetries: number;
  heartbeatInterval: number;
  collaborationTimeout: number;
  enableMetrics: boolean;
  enableAuditLog: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: MCPAgentIntegrationConfig = {
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
  heartbeatInterval: 60000, // 1 minute
  collaborationTimeout: 300000, // 5 minutes
  enableMetrics: true,
  enableAuditLog: true
};

/**
 * MCPAgentIntegration class implementation
 */
export class MCPAgentIntegration implements IMCPAgentIntegration {
  private config: MCPAgentIntegrationConfig;
  private broker: IMCPBroker;
  private client: IMCPClient;
  private registeredAgents = new Map<string, AgentMCPEndpoint>();
  private activeCollaborations = new Map<string, AgentCollaboration>();
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  private messageCounter = 0;

  constructor(
    broker: IMCPBroker,
    client: IMCPClient,
    config: Partial<MCPAgentIntegrationConfig> = {}
  ) {
    this.broker = broker;
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register an agent as an MCP service
   */
  async registerAgentAsMCPService(agent: Agent): Promise<AgentRegistrationResult> {
    try {
      // Validate agent information
      this.validateAgent(agent);

      // Create MCP service info from agent
      const serviceInfo: MCPServiceInfo = {
        id: agent.id,
        name: agent.name,
        version: agent.version,
        endpoint: agent.endpoint || `mcp://agent/${agent.id}`,
        capabilities: agent.capabilities,
        resources: agent.resources.map(resource => ({
          uri: resource,
          name: resource,
          description: `Resource from agent ${agent.name}`,
          handler: null as any // Will be set by the agent
        })),
        tools: agent.tools.map(tool => ({
          name: tool,
          description: `Tool from agent ${agent.name}`,
          inputSchema: { type: 'object' }, // Basic schema
          handler: null as any // Will be set by the agent
        })),
        status: this.mapAgentStatusToServiceStatus(agent.status),
        metadata: {
          ...agent.metadata,
          agentType: 'mcp-integrated',
          registeredBy: 'MCPAgentIntegration'
        },
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      };

      // Register with broker
      await this.broker.registerService(serviceInfo);

      // Create agent endpoint
      const endpoint: AgentMCPEndpoint = {
        agentId: agent.id,
        endpoint: serviceInfo.endpoint,
        capabilities: this.createDefaultCapabilities(agent),
        resources: agent.resources,
        tools: agent.tools,
        status: agent.status,
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
        metadata: agent.metadata
      };

      // Store registered agent
      this.registeredAgents.set(agent.id, endpoint);

      // Start heartbeat monitoring
      this.startHeartbeatMonitoring(agent.id);

      // Log registration if audit is enabled
      if (this.config.enableAuditLog) {
        console.log(`[MCPAgentIntegration] Agent ${agent.id} registered as MCP service`);
      }

      return {
        success: true,
        agentId: agent.id,
        endpoint: serviceInfo.endpoint,
        serviceInfo,
        errors: [],
        warnings: [],
        registeredAt: new Date()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        agentId: agent.id,
        errors: [errorMessage],
        warnings: [],
        registeredAt: new Date()
      };
    }
  }

  /**
   * Unregister an agent from MCP services
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      // Stop heartbeat monitoring
      this.stopHeartbeatMonitoring(agentId);

      // Unregister from broker
      await this.broker.unregisterService(agentId);

      // Remove from registered agents
      this.registeredAgents.delete(agentId);

      // End any active collaborations
      const collaborations = Array.from(this.activeCollaborations.values())
        .filter(collab => collab.participants.includes(agentId));
      
      for (const collaboration of collaborations) {
        await this.endCollaboration(collaboration.id);
      }

      // Log unregistration if audit is enabled
      if (this.config.enableAuditLog) {
        console.log(`[MCPAgentIntegration] Agent ${agentId} unregistered from MCP service`);
      }

      return true;
    } catch (error) {
      console.error(`[MCPAgentIntegration] Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Enable MCP communication for a specific agent
   */
  async enableAgentMCPCommunication(agentId: string): Promise<boolean> {
    try {
      const endpoint = this.registeredAgents.get(agentId);
      if (!endpoint) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Agent ${agentId} not found in registered agents`
        );
      }

      // Update agent status to active
      endpoint.status = AgentStatus.ACTIVE;
      endpoint.lastHeartbeat = new Date();
      
      // Update service status in broker
      const serviceInfo = await this.broker.getServiceHealth(agentId);
      if (serviceInfo) {
        // Re-register service as online
        await this.broker.registerService({
          ...serviceInfo as any,
          status: 'online'
        });
      }

      return true;
    } catch (error) {
      console.error(`[MCPAgentIntegration] Failed to enable MCP communication for agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Disable MCP communication for a specific agent
   */
  async disableAgentMCPCommunication(agentId: string): Promise<boolean> {
    try {
      const endpoint = this.registeredAgents.get(agentId);
      if (!endpoint) {
        return false;
      }

      // Update agent status to inactive
      endpoint.status = AgentStatus.INACTIVE;
      
      // Update service status in broker
      const serviceInfo = await this.broker.getServiceHealth(agentId);
      if (serviceInfo) {
        await this.broker.registerService({
          ...serviceInfo as any,
          status: 'offline'
        });
      }

      return true;
    } catch (error) {
      console.error(`[MCPAgentIntegration] Failed to disable MCP communication for agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Route a message between agents using MCP protocol
   */
  async routeAgentMessage(
    from: string,
    to: string,
    message: any,
    routing: Partial<AgentMessageRouting> = {}
  ): Promise<AgentMessageResult> {
    const messageId = this.generateMessageId();
    const startTime = Date.now();
    
    const routingInfo: AgentMessageRouting = {
      fromAgentId: from,
      toAgentId: to,
      messageId,
      messageType: routing.messageType || 'request',
      priority: routing.priority || 'normal',
      timeout: routing.timeout || this.config.defaultTimeout,
      retryPolicy: routing.retryPolicy || {
        maxRetries: this.config.maxRetries,
        backoffMs: 1000,
        exponential: true
      },
      metadata: routing.metadata
    };

    let retryCount = 0;
    let lastError: string | undefined;

    while (retryCount <= routingInfo.retryPolicy!.maxRetries) {
      try {
        // Check if target agent is registered and active
        const targetEndpoint = this.registeredAgents.get(to);
        if (!targetEndpoint) {
          throw new MCPErrorClass(
            MCPErrorCode.RESOURCE_NOT_FOUND,
            `Target agent ${to} not found or not registered`
          );
        }

        if (targetEndpoint.status !== AgentStatus.ACTIVE) {
          throw new MCPErrorClass(
            MCPErrorCode.SERVICE_UNAVAILABLE,
            `Target agent ${to} is not active (status: ${targetEndpoint.status})`
          );
        }

        // Create MCP message
        const mcpMessage: MCPMessage = {
          jsonrpc: '2.0',
          id: messageId,
          method: 'agent.message',
          params: {
            from,
            to,
            message,
            routing: routingInfo
          },
          meta: {
            timestamp: new Date(),
            source: from,
            priority: routingInfo.priority === 'urgent' ? 'high' : routingInfo.priority === 'low' ? 'low' : 'normal',
            timeout: routingInfo.timeout
          }
        };

        // Route through broker
        const response = await this.broker.routeRequest(
          mcpMessage,
          to
        );

        // Track collaboration if this is the start of one
        if (routing.metadata?.startCollaboration) {
          await this.startCollaboration([from, to], from, routing.metadata.purpose || 'Agent communication');
        }

        // Log successful routing if audit is enabled
        if (this.config.enableAuditLog) {
          console.log(`[MCPAgentIntegration] Message ${messageId} routed from ${from} to ${to}`);
        }

        return {
          success: true,
          messageId,
          routingInfo,
          deliveredAt: new Date(),
          response: response.result,
          retryCount,
          totalTime: Date.now() - startTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retryCount++;

        if (retryCount <= routingInfo.retryPolicy!.maxRetries) {
          // Calculate backoff delay
          const delay = routingInfo.retryPolicy!.exponential
            ? routingInfo.retryPolicy!.backoffMs * Math.pow(2, retryCount - 1)
            : routingInfo.retryPolicy!.backoffMs;

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      messageId,
      routingInfo,
      error: lastError,
      retryCount,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Get MCP capabilities for a specific agent
   */
  async getAgentMCPCapabilities(agentId: string): Promise<AgentCapabilityDiscovery> {
    try {
      const endpoint = this.registeredAgents.get(agentId);
      if (!endpoint) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Agent ${agentId} not found in registered agents`
        );
      }

      // Get service health from broker
      const health = await this.broker.getServiceHealth(agentId);
      
      return {
        agentId,
        capabilities: endpoint.capabilities,
        resources: endpoint.resources,
        tools: endpoint.tools,
        compatibility: {
          version: '1.0.0', // MCP version
          supported: true,
          issues: []
        },
        performance: {
          responseTime: health?.responseTime || 0,
          availability: this.calculateAvailability(endpoint),
          errorRate: health?.errorRate || 0
        },
        lastUpdated: endpoint.lastHeartbeat
      };

    } catch (error) {
      throw new MCPErrorClass(
        MCPErrorCode.INTERNAL_ERROR,
        `Failed to get capabilities for agent ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List all registered agents with MCP endpoints
   */
  async listAgentEndpoints(): Promise<AgentMCPEndpoint[]> {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<Agent[]> {
    const agents: Agent[] = [];
    
    for (const endpoint of this.registeredAgents.values()) {
      const hasCapability = endpoint.capabilities.some(cap => 
        cap.name === capability || cap.methods.includes(capability)
      );
      
      if (hasCapability) {
        agents.push({
          id: endpoint.agentId,
          name: endpoint.agentId, // We don't store full agent info, just endpoint
          version: '1.0.0',
          capabilities: endpoint.capabilities.map(cap => cap.name),
          resources: endpoint.resources,
          tools: endpoint.tools,
          endpoint: endpoint.endpoint,
          status: endpoint.status,
          createdAt: endpoint.registeredAt,
          lastActivity: endpoint.lastHeartbeat,
          metadata: endpoint.metadata
        });
      }
    }
    
    return agents;
  }

  /**
   * Start collaboration tracking between agents
   */
  async startCollaboration(
    participants: string[],
    initiator: string,
    purpose: string
  ): Promise<AgentCollaboration> {
    const collaborationId = this.generateCollaborationId();
    
    const collaboration: AgentCollaboration = {
      id: collaborationId,
      participants,
      initiator,
      purpose,
      startedAt: new Date(),
      status: 'active',
      messageCount: 0,
      lastActivity: new Date(),
      metadata: {}
    };

    this.activeCollaborations.set(collaborationId, collaboration);

    // Set timeout for collaboration
    setTimeout(() => {
      this.endCollaboration(collaborationId);
    }, this.config.collaborationTimeout);

    // Log collaboration start if audit is enabled
    if (this.config.enableAuditLog) {
      console.log(`[MCPAgentIntegration] Collaboration ${collaborationId} started between agents: ${participants.join(', ')}`);
    }

    return collaboration;
  }

  /**
   * End collaboration tracking
   */
  async endCollaboration(collaborationId: string): Promise<boolean> {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (!collaboration) {
      return false;
    }

    collaboration.status = 'completed';
    collaboration.endedAt = new Date();

    // Log collaboration end if audit is enabled
    if (this.config.enableAuditLog) {
      console.log(`[MCPAgentIntegration] Collaboration ${collaborationId} ended`);
    }

    // Remove from active collaborations after a delay to allow for final queries
    setTimeout(() => {
      this.activeCollaborations.delete(collaborationId);
    }, 60000); // 1 minute delay

    return true;
  }

  /**
   * Get active collaborations for an agent
   */
  async getAgentCollaborations(agentId: string): Promise<AgentCollaboration[]> {
    return Array.from(this.activeCollaborations.values())
      .filter(collab => collab.participants.includes(agentId) && collab.status === 'active');
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean> {
    const endpoint = this.registeredAgents.get(agentId);
    if (!endpoint) {
      return false;
    }

    endpoint.status = status;
    endpoint.lastHeartbeat = new Date();

    return true;
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(agentId: string): Promise<{
    agentId: string;
    status: AgentStatus;
    lastHeartbeat: Date;
    responseTime: number;
    errorRate: number;
    availability: number;
  }> {
    const endpoint = this.registeredAgents.get(agentId);
    if (!endpoint) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Agent ${agentId} not found`
      );
    }

    const health = await this.broker.getServiceHealth(agentId);

    return {
      agentId,
      status: endpoint.status,
      lastHeartbeat: endpoint.lastHeartbeat,
      responseTime: health?.responseTime || 0,
      errorRate: health?.errorRate || 0,
      availability: this.calculateAvailability(endpoint)
    };
  }

  /**
   * Send heartbeat for an agent
   */
  async sendAgentHeartbeat(agentId: string): Promise<boolean> {
    const endpoint = this.registeredAgents.get(agentId);
    if (!endpoint) {
      return false;
    }

    endpoint.lastHeartbeat = new Date();
    return true;
  }

  // Private helper methods

  private validateAgent(agent: Agent): void {
    if (!agent.id || !agent.name) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        'Agent must have id and name'
      );
    }

    if (!Array.isArray(agent.capabilities) || !Array.isArray(agent.resources) || !Array.isArray(agent.tools)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        'Agent capabilities, resources, and tools must be arrays'
      );
    }
  }

  private mapAgentStatusToServiceStatus(status: AgentStatus): ServiceStatus {
    switch (status) {
      case AgentStatus.ACTIVE:
        return ServiceStatus.ONLINE;
      case AgentStatus.INACTIVE:
        return ServiceStatus.OFFLINE;
      case AgentStatus.BUSY:
        return ServiceStatus.DEGRADED; // Use DEGRADED which exists in ServiceStatus enum
      case AgentStatus.ERROR:
        return ServiceStatus.OFFLINE;
      case AgentStatus.MAINTENANCE:
        return ServiceStatus.MAINTENANCE;
      default:
        return ServiceStatus.OFFLINE;
    }
  }

  private createDefaultCapabilities(agent: Agent): MCPCapability[] {
    return [
      {
        name: 'agent.communication',
        version: '1.0.0',
        description: 'Basic agent-to-agent communication',
        methods: ['agent.message', 'agent.status', 'agent.heartbeat']
      },
      {
        name: 'agent.resources',
        version: '1.0.0',
        description: 'Agent resource access',
        methods: agent.resources.map(resource => `resource.${resource}`)
      },
      {
        name: 'agent.tools',
        version: '1.0.0',
        description: 'Agent tool execution',
        methods: agent.tools.map(tool => `tool.${tool}`)
      }
    ];
  }

  private calculateAvailability(endpoint: AgentMCPEndpoint): number {
    const now = Date.now();
    const lastHeartbeat = endpoint.lastHeartbeat.getTime();
    const timeSinceHeartbeat = now - lastHeartbeat;
    
    // Consider agent available if heartbeat is within 2x the heartbeat interval
    const maxHeartbeatAge = this.config.heartbeatInterval * 2;
    
    if (timeSinceHeartbeat <= maxHeartbeatAge) {
      return 1.0; // 100% available
    } else {
      // Gradual degradation based on time since last heartbeat
      const degradationFactor = Math.min(timeSinceHeartbeat / (maxHeartbeatAge * 5), 1);
      return Math.max(0, 1 - degradationFactor);
    }
  }

  private startHeartbeatMonitoring(agentId: string): void {
    // Clear existing timer if any
    this.stopHeartbeatMonitoring(agentId);

    const timer = setInterval(async () => {
      const endpoint = this.registeredAgents.get(agentId);
      if (!endpoint) {
        this.stopHeartbeatMonitoring(agentId);
        return;
      }

      // Check if agent is still responsive
      const timeSinceHeartbeat = Date.now() - endpoint.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > this.config.heartbeatInterval * 3) {
        // Mark as inactive if no heartbeat for 3 intervals
        endpoint.status = AgentStatus.INACTIVE;
        console.warn(`[MCPAgentIntegration] Agent ${agentId} marked as inactive due to missing heartbeat`);
      }
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(agentId, timer);
  }

  private stopHeartbeatMonitoring(agentId: string): void {
    const timer = this.heartbeatTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(agentId);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageCounter}`;
  }

  private generateCollaborationId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}