/**
 * Unified Agent Types for The New Fuse Framework
 *
 * This module consolidates all agent-related types from various orchestration systems
 * into a unified, coherent type system that supports all existing functionality
 * while enabling future extensibility.
 */
export type AgentType = 'cli' | 'workflow' | 'sync' | 'custom' | 'federation';
export type AgentStatus = 'available' | 'busy' | 'offline' | 'error' | 'maintenance';
export type AgentCapability = string;
export type AgentPriority = 'low' | 'medium' | 'high' | 'critical';
/**
 * Core agent metadata structure
 */
export interface AgentMetadata {
    name: string;
    description: string;
    version: string;
    author?: string;
    tags?: string[];
    documentation?: string;
    lastUpdated: Date;
    healthCheckEndpoint?: string;
}
/**
 * Agent performance metrics
 */
export interface AgentMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    averageResponseTime: number;
    successRate: number;
    currentLoad: number;
    maxLoad: number;
    queueSize: number;
    memoryUsage?: number;
    cpuUsage?: number;
    lastExecution?: Date;
    uptime: number;
}
/**
 * Agent resource requirements and limits
 */
export interface AgentResources {
    cpu?: {
        min: number;
        max: number;
        current: number;
    };
    memory?: {
        min: number;
        max: number;
        current: number;
    };
    storage?: {
        min: number;
        max: number;
        current: number;
    };
    network?: {
        bandwidth: number;
        latency: number;
    };
    concurrent?: {
        max: number;
        current: number;
    };
}
/**
 * Agent configuration structure
 */
export interface AgentConfiguration {
    timeout: number;
    retryPolicy: {
        maxRetries: number;
        backoffStrategy: 'linear' | 'exponential' | 'fixed';
        baseDelay: number;
        maxDelay: number;
    };
    resources: AgentResources;
    environment?: Record<string, string>;
    security?: {
        allowedTenants?: string[];
        permissions?: string[];
        accessLevel: 'public' | 'private' | 'restricted';
    };
    communication?: {
        protocols: ('websocket' | 'redis' | 'http' | 'file')[];
        preferredProtocol: string;
        compression?: boolean;
        encryption?: boolean;
    };
}
/**
 * Unified agent interface that consolidates all agent types
 */
export interface UnifiedAgent {
    id: string;
    type: AgentType;
    metadata: AgentMetadata;
    status: AgentStatus;
    capabilities: AgentCapability[];
    metrics: AgentMetrics;
    configuration: AgentConfiguration;
    lastSeen: Date;
    registeredAt: Date;
    tenantId?: string;
    workspaceId?: string;
    integrationData?: {
        cliCommands?: string[];
        nodeTypes?: string[];
        workflowId?: string;
        syncCapabilities?: string[];
        instanceId?: string;
        federationEndpoint?: string;
        externalSystem?: string;
    };
}
/**
 * Agent capability definition with requirements
 */
export interface AgentCapabilityDefinition {
    name: string;
    description: string;
    category: string;
    requirements: {
        minVersion?: string;
        dependencies?: string[];
        resources?: Partial<AgentResources>;
    };
    parameters?: Record<string, {
        type: string;
        required: boolean;
        default?: any;
        description?: string;
    }>;
}
/**
 * Agent selection criteria for optimal agent matching
 */
export interface AgentSelectionCriteria {
    requiredCapabilities: AgentCapability[];
    optionalCapabilities?: AgentCapability[];
    excludeAgents?: string[];
    preferredAgents?: string[];
    maxResponseTime?: number;
    minSuccessRate?: number;
    maxCurrentLoad?: number;
    resourceRequirements?: Partial<AgentResources>;
    tenantId?: string;
    workspaceId?: string;
    priority: AgentPriority;
    loadBalancing?: 'round_robin' | 'least_loaded' | 'performance_based' | 'random';
    preferLocal?: boolean;
    allowFailover?: boolean;
    maxFailoverAttempts?: number;
}
/**
 * Agent selection result with scoring information
 */
export interface AgentSelectionResult {
    agent: UnifiedAgent;
    score: number;
    reasoning: string;
    alternativeAgents?: {
        agent: UnifiedAgent;
        score: number;
    }[];
    warning?: string;
}
/**
 * Agent registration request
 */
export interface AgentRegistrationRequest {
    agent: Omit<UnifiedAgent, 'id' | 'registeredAt' | 'lastSeen' | 'metrics'>;
    capabilities: AgentCapabilityDefinition[];
    healthCheck?: () => Promise<boolean>;
}
/**
 * Agent health check result
 */
export interface AgentHealthCheck {
    agentId: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    responseTime: number;
    details?: {
        memory?: number;
        cpu?: number;
        errors?: string[];
        warnings?: string[];
    };
}
/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
    agentId?: string;
    taskId: string;
    task: any;
    context?: Record<string, any>;
    priority?: AgentPriority;
    timeout?: number;
    retryPolicy?: AgentConfiguration['retryPolicy'];
    callbacks?: {
        onProgress?: (progress: number, message?: string) => void;
        onComplete?: (result: any) => void;
        onError?: (error: Error) => void;
    };
}
/**
 * Agent execution result
 */
export interface AgentExecutionResult {
    agentId: string;
    taskId: string;
    success: boolean;
    result?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metrics: {
        startTime: Date;
        endTime: Date;
        executionTime: number;
        resourceUsage?: Partial<AgentResources>;
    };
    context?: Record<string, any>;
}
/**
 * Agent registry event types
 */
export type AgentRegistryEventType = 'agent_registered' | 'agent_deregistered' | 'agent_updated' | 'agent_status_changed' | 'agent_health_check' | 'agent_capability_updated' | 'agent_metrics_updated' | 'registry_initialized';
/**
 * Agent registry event
 */
export interface AgentRegistryEvent {
    type: AgentRegistryEventType;
    agentId: string;
    timestamp: Date;
    data: any;
    metadata?: Record<string, any>;
}
/**
 * Legacy agent type mappings for backward compatibility
 */
export interface LegacyAgentMappings {
    cliAgentTypes: Record<string, AgentType>;
    workflowNodeCapabilities: Record<string, AgentCapability[]>;
    syncAgentTypes: Record<string, AgentType>;
    customAgentMappings: Record<string, {
        type: AgentType;
        capabilities: AgentCapability[];
    }>;
}
/**
 * Message processing configuration
 */
export interface MessageProcessingConfig {
    routing: {
        enableRoundRobin: boolean;
        enableLoadBalancing: boolean;
        enableFailover: boolean;
        maxHops: number;
    };
    limits: {
        maxMessageSize: number;
        maxBatchSize: number;
        maxProcessingTime: number;
        maxRetries: number;
    };
    performance: {
        enableCompression: boolean;
        enableCaching: boolean;
        cacheTtl: number;
        enablePipelining: boolean;
        maxConcurrentMessages: number;
    };
    security: {
        enableEncryption: boolean;
        enableSigning: boolean;
        enableChecksums: boolean;
        allowedOrigins?: string[];
        requireAuthentication: boolean;
    };
}
/**
 * Unified orchestration configuration
 */
export interface UnifiedOrchestrationConfig {
    agentRegistry: AgentRegistryConfig;
    messageProcessing: MessageProcessingConfig;
    enableFederation?: boolean;
    federationEndpoints?: string[];
}
/**
 * Agent registry configuration
 */
export interface AgentRegistryConfig {
    maxAgents: number;
    defaultTimeout: number;
    healthCheckInterval: number;
    metricsRetentionPeriod: number;
    loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'performance_based';
    enableCaching: boolean;
    cacheTimeout: number;
    maxConcurrentExecutions: number;
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    enableEventLogging: boolean;
    enableTenantIsolation: boolean;
    requireAuthentication: boolean;
    allowCrossTenanantAccess: boolean;
    enableLegacySupport: boolean;
    legacyMappings: LegacyAgentMappings;
    enableFederation: boolean;
    federationEndpoints?: string[];
}
//# sourceMappingURL=UnifiedAgentTypes.d.ts.map