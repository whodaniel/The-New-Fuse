/**
 * AgentDiscoveryService.ts
 *
 * Dedicated service for agent discovery and configuration management.
 * Handles agent configuration loading, validation, capability mapping, and health monitoring.
 */
import { EventEmitter } from 'events';
import { AgentConfiguration } from './AgentHub';
export interface AgentDiscoveryOptions {
    agentsDirectory?: string;
    watchForChanges?: boolean;
    validationStrict?: boolean;
    hotReload?: boolean;
}
export interface AgentRegistryEntry {
    id: string;
    configuration: AgentConfiguration;
    status: 'active' | 'inactive' | 'error' | 'loading';
    lastUpdated: Date;
    healthStatus?: AgentHealthStatus;
    discoverySource: 'local' | 'remote' | 'registry';
}
export interface AgentHealthStatus {
    isHealthy: boolean;
    lastCheck: Date;
    responseTime?: number;
    errorCount: number;
    lastError?: string;
}
export interface CapabilityMapping {
    agentCapability: string;
    a2aCapability?: string;
    mcpCapability?: string;
    description: string;
}
export declare class AgentDiscoveryService extends EventEmitter {
    private options;
    private agentRegistry;
    private capabilityMappings;
    private configurationValidators;
    private watchers;
    private healthCheckIntervals;
    private fileToAgentId;
    constructor(options?: AgentDiscoveryOptions);
    /**
     * Initialize capability mappings between agent capabilities and A2A/MCP
     */
    private initializeCapabilityMappings;
    /**
     * Initialize configuration validators
     */
    private initializeValidators;
    /**
     * Discover and load agent configurations from multiple sources
     */
    discoverAgents(): Promise<AgentRegistryEntry[]>;
    /**
     * Discover agents from local directory
     */
    private discoverLocalAgents;
    /**
     * Start health monitoring for all agents
     */
    private startHealthMonitoring;
    30000: any;
}
//# sourceMappingURL=AgentDiscoveryService.d.ts.map