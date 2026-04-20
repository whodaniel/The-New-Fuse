/**
 * MCP Agent Integration Interface
 * 
 * This interface defines the contract for integrating agents with the MCP system,
 * enabling agent-to-agent communication through standardized MCP protocols.
 */

import type { MCPCapability } from './IMCPCapability.js';
import type { MCPServiceInfo } from '../types/broker.js';
import type { MCPMessage } from './IMCPMessage.js';

// Re-export for other modules
export type { MCPCapability };

/**
 * Agent information for MCP integration
 */
export interface Agent {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities: string[];
  resources: string[];
  tools: string[];
  endpoint?: string;
  metadata?: Record<string, any>;
  status: AgentStatus;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Agent status enumeration
 */
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

/**
 * Agent MCP endpoint configuration
 */
export interface AgentMCPEndpoint {
  agentId: string;
  endpoint: string;
  capabilities: MCPCapability[];
  resources: string[];
  tools: string[];
  status: AgentStatus;
  registeredAt: Date;
  lastHeartbeat: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent message routing information
 */
export interface AgentMessageRouting {
  fromAgentId: string;
  toAgentId: string;
  messageId: string;
  messageType: 'request' | 'response' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    exponential: boolean;
  };
  metadata?: Record<string, any>;
}

/**
 * Agent collaboration tracking information
 */
export interface AgentCollaboration {
  id: string;
  participants: string[];
  initiator: string;
  purpose: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  messageCount: number;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent capability discovery result
 */
export interface AgentCapabilityDiscovery {
  agentId: string;
  capabilities: MCPCapability[];
  resources: string[];
  tools: string[];
  compatibility: {
    version: string;
    supported: boolean;
    issues: string[];
  };
  performance: {
    responseTime: number;
    availability: number;
    errorRate: number;
  };
  lastUpdated: Date;
}

/**
 * Agent registration result
 */
export interface AgentRegistrationResult {
  success: boolean;
  agentId: string;
  endpoint?: string;
  serviceInfo?: MCPServiceInfo;
  errors: string[];
  warnings: string[];
  registeredAt: Date;
}

/**
 * Agent message routing result
 */
export interface AgentMessageResult {
  success: boolean;
  messageId: string;
  routingInfo: AgentMessageRouting;
  deliveredAt?: Date;
  response?: any;
  error?: string;
  retryCount: number;
  totalTime: number;
}

/**
 * Main interface for MCP Agent Integration
 * 
 * This interface provides methods for registering agents as MCP services,
 * enabling agent-to-agent communication, and managing agent capabilities.
 */
export interface IMCPAgentIntegration {
  /**
   * Register an agent as an MCP service
   * 
   * @param agent - The agent to register
   * @returns Promise resolving to registration result
   */
  registerAgentAsMCPService(agent: Agent): Promise<AgentRegistrationResult>;

  /**
   * Unregister an agent from MCP services
   * 
   * @param agentId - The ID of the agent to unregister
   * @returns Promise resolving to success status
   */
  unregisterAgent(agentId: string): Promise<boolean>;

  /**
   * Enable MCP communication for a specific agent
   * 
   * @param agentId - The ID of the agent to enable
   * @returns Promise resolving to success status
   */
  enableAgentMCPCommunication(agentId: string): Promise<boolean>;

  /**
   * Disable MCP communication for a specific agent
   * 
   * @param agentId - The ID of the agent to disable
   * @returns Promise resolving to success status
   */
  disableAgentMCPCommunication(agentId: string): Promise<boolean>;

  /**
   * Route a message between agents using MCP protocol
   * 
   * @param from - Source agent ID
   * @param to - Target agent ID
   * @param message - Message to route
   * @param routing - Optional routing configuration
   * @returns Promise resolving to routing result
   */
  routeAgentMessage(
    from: string, 
    to: string, 
    message: any, 
    routing?: Partial<AgentMessageRouting>
  ): Promise<AgentMessageResult>;

  /**
   * Get MCP capabilities for a specific agent
   * 
   * @param agentId - The ID of the agent
   * @returns Promise resolving to capability discovery result
   */
  getAgentMCPCapabilities(agentId: string): Promise<AgentCapabilityDiscovery>;

  /**
   * List all registered agents with MCP endpoints
   * 
   * @returns Promise resolving to array of agent endpoints
   */
  listAgentEndpoints(): Promise<AgentMCPEndpoint[]>;

  /**
   * Find agents by capability
   * 
   * @param capability - Capability to search for
   * @returns Promise resolving to array of matching agents
   */
  findAgentsByCapability(capability: string): Promise<Agent[]>;

  /**
   * Start collaboration tracking between agents
   * 
   * @param participants - Array of agent IDs
   * @param initiator - ID of the initiating agent
   * @param purpose - Purpose of the collaboration
   * @returns Promise resolving to collaboration tracking info
   */
  startCollaboration(
    participants: string[], 
    initiator: string, 
    purpose: string
  ): Promise<AgentCollaboration>;

  /**
   * End collaboration tracking
   * 
   * @param collaborationId - ID of the collaboration to end
   * @returns Promise resolving to success status
   */
  endCollaboration(collaborationId: string): Promise<boolean>;

  /**
   * Get active collaborations for an agent
   * 
   * @param agentId - The ID of the agent
   * @returns Promise resolving to array of active collaborations
   */
  getAgentCollaborations(agentId: string): Promise<AgentCollaboration[]>;

  /**
   * Update agent status
   * 
   * @param agentId - The ID of the agent
   * @param status - New status
   * @returns Promise resolving to success status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean>;

  /**
   * Get agent health status
   * 
   * @param agentId - The ID of the agent
   * @returns Promise resolving to health information
   */
  getAgentHealth(agentId: string): Promise<{
    agentId: string;
    status: AgentStatus;
    lastHeartbeat: Date;
    responseTime: number;
    errorRate: number;
    availability: number;
  }>;

  /**
   * Send heartbeat for an agent
   * 
   * @param agentId - The ID of the agent
   * @returns Promise resolving to success status
   */
  sendAgentHeartbeat(agentId: string): Promise<boolean>;
}