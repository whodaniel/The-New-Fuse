/**
 * MCP Agent Integration Implementation
 *
 * This class provides the implementation for integrating agents with the MCP system,
 * enabling agent-to-agent communication through standardized MCP protocols.
 */
import type { IMCPAgentIntegration, Agent, AgentMCPEndpoint, AgentMessageRouting, AgentCollaboration, AgentCapabilityDiscovery, AgentRegistrationResult, AgentMessageResult } from '../interfaces/IMCPAgentIntegration';
import { AgentStatus } from '../interfaces/IMCPAgentIntegration';
import type { IMCPBroker } from '../interfaces/IMCPBroker';
import type { IMCPClient } from '../interfaces/IMCPClient';
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
 * MCPAgentIntegration class implementation
 */
export declare class MCPAgentIntegration implements IMCPAgentIntegration {
    private config;
    private broker;
    private client;
    private registeredAgents;
    private activeCollaborations;
    private heartbeatTimers;
    private messageCounter;
    constructor(broker: IMCPBroker, client: IMCPClient, config?: Partial<MCPAgentIntegrationConfig>);
    /**
     * Register an agent as an MCP service
     */
    registerAgentAsMCPService(agent: Agent): Promise<AgentRegistrationResult>;
    /**
     * Unregister an agent from MCP services
     */
    unregisterAgent(agentId: string): Promise<boolean>;
    /**
     * Enable MCP communication for a specific agent
     */
    enableAgentMCPCommunication(agentId: string): Promise<boolean>;
    /**
     * Disable MCP communication for a specific agent
     */
    disableAgentMCPCommunication(agentId: string): Promise<boolean>;
    /**
     * Route a message between agents using MCP protocol
     */
    routeAgentMessage(from: string, to: string, message: any, routing?: Partial<AgentMessageRouting>): Promise<AgentMessageResult>;
    /**
     * Get MCP capabilities for a specific agent
     */
    getAgentMCPCapabilities(agentId: string): Promise<AgentCapabilityDiscovery>;
    /**
     * List all registered agents with MCP endpoints
     */
    listAgentEndpoints(): Promise<AgentMCPEndpoint[]>;
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): Promise<Agent[]>;
    /**
     * Start collaboration tracking between agents
     */
    startCollaboration(participants: string[], initiator: string, purpose: string): Promise<AgentCollaboration>;
    /**
     * End collaboration tracking
     */
    endCollaboration(collaborationId: string): Promise<boolean>;
    /**
     * Get active collaborations for an agent
     */
    getAgentCollaborations(agentId: string): Promise<AgentCollaboration[]>;
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean>;
    /**
     * Get agent health status
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
     */
    sendAgentHeartbeat(agentId: string): Promise<boolean>;
    private validateAgent;
    private mapAgentStatusToServiceStatus;
    private createDefaultCapabilities;
    private calculateAvailability;
    private startHeartbeatMonitoring;
    private stopHeartbeatMonitoring;
    private generateMessageId;
    private generateCollaborationId;
}
//# sourceMappingURL=MCPAgentIntegration.d.ts.map