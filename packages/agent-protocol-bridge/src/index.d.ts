export type { ClaudeSDKAgentConfig } from './adapters/ClaudeAgentSDKAdapter';
export declare class AgentProtocolBridge {
    translateMessage(message: any, fromProtocol: string, toProtocol: string): Promise<any>;
    connect(config: any): Promise<any>;
    disconnect(): Promise<void>;
}
export interface ProtocolMessage {
    id: string;
    type: string;
    payload: any;
    metadata?: Record<string, any>;
}
export interface BridgeConnection {
    id: string;
    protocol: string;
    status: 'connected' | 'disconnected' | 'error';
}
export declare class IntegrationBridgeFactoryImplementation {
    createAgentHub(config?: any): Promise<AgentHub>;
    createIntegratedAgentStack(config?: any): Promise<IntegratedAgentStack>;
    createAgentDiscoveryService(options?: any): Promise<AgentDiscoveryService>;
    createTaskOrchestrator(options?: any): Promise<TaskOrchestrator>;
    createAgentCommunicationBridge(a2aService?: any, mcpClient?: any, messageRouter?: any, config?: any): Promise<AgentCommunicationBridge>;
    validateConfiguration(config: any): {
        valid: boolean;
        errors: string[];
    };
}
export interface AgentHubConfig {
    enabled?: boolean;
    maxAgents?: number;
    orchestratorOptions?: any;
}
export declare class AgentHub {
    private config?;
    constructor(config?: AgentHubConfig | undefined);
    registerAgent(config: any): Promise<string>;
    executeTask(taskId: string, agentId: string): Promise<any>;
}
export declare class IntegratedAgentStack {
    private config?;
    constructor(config?: AgentHubConfig | undefined);
    initialize(): Promise<void>;
}
export interface AgentConfiguration {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
}
export interface AgentCapability {
    name: string;
    description: string;
    enabled: boolean;
}
export interface AgentConfigurationDetails extends AgentConfiguration {
    metadata: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
}
export interface ExecutionContext {
    taskId: string;
    agentId: string;
    context: Record<string, any>;
}
export interface TaskExecutionOptions {
    timeout?: number;
    priority?: 'low' | 'medium' | 'high';
    retryCount?: number;
}
export declare class AgentDiscoveryService {
    private options?;
    constructor(options?: AgentDiscoveryOptions | undefined);
    discoverAgents(): Promise<AgentRegistryEntry[]>;
    registerAgent(entry: AgentRegistryEntry): Promise<void>;
}
export interface AgentDiscoveryOptions {
    scanInterval?: number;
    enableHealthCheck?: boolean;
}
export interface AgentRegistryEntry {
    id: string;
    name: string;
    type: string;
    endpoint: string;
    capabilities: string[];
    health: AgentHealthStatus;
}
export interface AgentHealthStatus {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    metrics?: Record<string, any>;
}
export interface CapabilityMapping {
    capability: string;
    agents: string[];
}
export declare class TaskOrchestrator {
    private options?;
    constructor(options?: any | undefined);
    orchestrateWorkflow(definition: WorkflowDefinition): Promise<WorkflowExecution>;
    executeStep(step: WorkflowStep): Promise<any>;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    steps: WorkflowStep[];
    metadata?: Record<string, any>;
}
export interface WorkflowStep {
    id: string;
    type: string;
    agentId: string;
    input: any;
    dependencies?: string[];
}
export interface WorkflowExecution {
    id: string;
    definition: WorkflowDefinition;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    steps: any[];
    result: any;
}
export interface TaskQueueItem {
    id: string;
    taskId: string;
    agentId: string;
    priority: number;
    createdAt: Date;
}
export interface ResourceAllocation {
    agentId: string;
    resources: Record<string, any>;
    allocated: boolean;
}
export declare class AgentCommunicationBridge {
    private a2aService?;
    private mcpClient?;
    private messageRouter?;
    private config?;
    constructor(a2aService?: any | undefined, mcpClient?: any | undefined, messageRouter?: any | undefined, config?: any | undefined);
    sendMessage(message: any, fromAgent: string, toAgent: string): Promise<any>;
    translateProtocol(message: any, fromProtocol: string, toProtocol: string): Promise<any>;
}
export interface BridgeConfiguration {
    enableLogging?: boolean;
    timeout?: number;
    retryCount?: number;
}
export interface CommunicationContext {
    sessionId: string;
    participants: string[];
    metadata: Record<string, any>;
}
export interface CommunicationMetrics {
    messagesSent: number;
    messagesReceived: number;
    errors: number;
    avgResponseTime: number;
}
export declare class ProtocolValidator {
    validate(message: any, protocol: string): Promise<ValidationResult>;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export declare const SUPPORTED_PROTOCOLS: readonly ["A2A_V1", "A2A_V2", "MCP", "CLAUDE_SUB_AGENT", "PYDANTIC"];
export declare const BRIDGE_TYPES: readonly ["MCP", "A2A", "WEBSOCKET", "REDIS", "HTTP", "GRPC"];
export declare const INTEGRATION_CAPABILITIES: readonly ["agent_discovery", "agent_health_monitoring", "multi_agent_orchestration", "task_workflow_management"];
export declare const VERSION = "2.0.0";
export declare function createAgentHub(config?: AgentHubConfig): Promise<AgentHub>;
export declare function createIntegratedAgentStack(config?: AgentHubConfig): Promise<IntegratedAgentStack>;
export declare function createAgentDiscoveryService(options?: AgentDiscoveryOptions): Promise<AgentDiscoveryService>;
export declare function createTaskOrchestrator(options?: any): Promise<TaskOrchestrator>;
export declare function createAgentCommunicationBridge(a2aService?: any, mcpClient?: any, messageRouter?: any, config?: any): Promise<AgentCommunicationBridge>;
export declare function validateAgentHubConfiguration(config: AgentHubConfig): {
    valid: boolean;
    errors: string[];
};
export interface AgentProtocolBridgeConfiguration {
    protocols: {
        enabled: (typeof SUPPORTED_PROTOCOLS)[number][];
        defaultProtocol?: (typeof SUPPORTED_PROTOCOLS)[number];
    };
    integrations: Record<string, any>;
    security: Record<string, any>;
    performance: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map