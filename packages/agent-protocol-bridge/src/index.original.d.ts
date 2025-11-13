/**
 * Agent Protocol Bridge Package
 *
 * Universal protocol bridge for The New Fuse AI Agent framework.
 * Enables seamless communication between different agent protocols and
 * comprehensive integration with various systems.
 *
 * ✨ NEW: Enhanced with TRAYCER-style Agent Communication
 *
 * Core Protocols:
 * - A2A (Agent-to-Agent) v1.0 & v2.0
 * - MCP (Model Context Protocol)
 * - Claude Sub-Agent Protocol
 * - Pydantic Agent Protocol
 * - And more...
 *
 * TRAYCER-style Agent Hub Features:
 * - Agent Discovery & Health Monitoring
 * - Multi-Agent Task Orchestration
 * - Protocol Translation & Communication Bridge
 * - Workflow Management & Context Preservation
 * - Error Recovery & Resource Management
 * - Hot-Reload Configuration Support
 *
 * Integration Systems:
 * - N8N Workflow Automation
 * - Webhook Event Delivery
 * - Server-Sent Events (SSE)
 * - WebSocket Real-Time Communication
 * - Blockchain/Web3 Integration
 * - Theia IDE Integration
 */
export { AgentProtocolBridge, ProtocolMessage, BridgeConnection } from './AgentProtocolBridge';
export { IntegrationBridgeFactoryImplementation, AgentHubConfig, IntegratedAgentStack } from './IntegrationBridgeFactory';
export { AgentHub, AgentConfiguration, AgentCapability, AgentConfigurationDetails, ExecutionContext, TaskExecutionOptions } from './services/AgentHub';
export { AgentDiscoveryService, AgentDiscoveryOptions, AgentRegistryEntry, AgentHealthStatus, CapabilityMapping } from './services/AgentDiscoveryService';
export { TaskOrchestrator, WorkflowDefinition, WorkflowStep, WorkflowExecution, TaskQueueItem, ResourceAllocation } from './services/TaskOrchestrator';
export { AgentCommunicationBridge, BridgeConfiguration as AgentBridgeConfiguration, CommunicationContext, CommunicationMetrics } from './services/AgentCommunicationBridge';
export * from './adapters';
export { ProtocolValidator, ValidationResult } from './validation/ProtocolValidator';
export * from './types/claude-types';
export * from './integrations';
export declare const SUPPORTED_PROTOCOLS: readonly ["A2A_V1", "A2A_V2", "MCP", "CLAUDE_SUB_AGENT", "PYDANTIC", "GOOGLE_A2A", "ANTHROPIC_MCP", "ANTHROPIC_XML", "OPENAI_ASSISTANT", "LANGCHAIN", "AUTOGEN", "CREWAI", "PYDANTIC_AGENT", "N8N_WORKFLOW", "WEBHOOK_SYSTEM", "SSE_EVENTS", "WEB3_BLOCKCHAIN", "STREAMING_HTTP", "LANGFLOW", "LANGCHAIN"];
export declare const BRIDGE_TYPES: readonly ["MCP", "A2A", "WEBSOCKET", "REDIS", "HTTP", "GRPC", "THEIA", "ELECTRON", "RELAY", "N8N", "WEBHOOK", "SSE", "WEB3", "BLOCKCHAIN", "CLAUDE", "PYDANTIC", "STREAMING_HTTP", "LANGFLOW", "LANGCHAIN"];
export declare const INTEGRATION_CAPABILITIES: readonly ["n8n_workflow_execution", "n8n_webhook_handling", "n8n_scheduling", "webhook_outbound_delivery", "webhook_signature_verification", "webhook_retry_handling", "sse_event_streaming", "sse_subscription_management", "websocket_bidirectional_communication", "websocket_room_management", "web3_account_management", "web3_transaction_handling", "web3_smart_contract_interaction", "web3_event_monitoring", "theia_workspace_management", "theia_file_operations", "theia_language_server_protocol", "theia_debug_protocol", "claude_sub_agent_orchestration", "claude_task_delegation", "claude_terminal_integration", "claude_tool_use", "agent_discovery", "agent_health_monitoring", "multi_agent_orchestration", "task_workflow_management", "agent_communication_bridge", "protocol_translation", "context_preservation", "error_recovery", "resource_management", "hot_reload_configuration", "pydantic_model_serialization", "pydantic_model_deserialization", "pydantic_data_validation", "pydantic_schema_generation", "streaming_http_connection_management", "streaming_http_event_delivery", "streaming_http_reconnection_handling", "langflow_flow_management", "langflow_flow_execution", "langflow_component_interaction", "langchain_chain_execution", "langchain_agent_running", "langchain_tool_usage", "langchain_memory_management"];
export declare const VERSION = "2.0.0";
/**
 * Create a simple AgentHub instance for basic agent communication
 */
export declare function createAgentHub(config?: AgentHubConfig): Promise<AgentHub>;
/**
 * Create an integrated agent stack with all TRAYCER-style services
 */
export declare function createIntegratedAgentStack(config?: AgentHubConfig): Promise<IntegratedAgentStack>;
/**
 * Create an agent discovery service for configuration management
 */
export declare function createAgentDiscoveryService(options?: AgentDiscoveryOptions): Promise<AgentDiscoveryService>;
/**
 * Create a task orchestrator for workflow management
 */
export declare function createTaskOrchestrator(options?: AgentHubConfig['orchestratorOptions']): Promise<TaskOrchestrator>;
/**
 * Create an agent communication bridge for protocol translation
 */
export declare function createAgentCommunicationBridge(a2aService?: any, mcpClient?: any, messageRouter?: any, config?: AgentBridgeConfiguration): Promise<AgentCommunicationBridge>;
/**
 * Validate agent hub configuration
 */
export declare function validateAgentHubConfiguration(config: AgentHubConfig): {
    valid: boolean;
    errors: string[];
};
export interface AgentProtocolBridgeConfiguration {
    protocols: {
        enabled: (typeof SUPPORTED_PROTOCOLS)[number][];
        defaultProtocol?: (typeof SUPPORTED_PROTOCOLS)[number];
    };
    integrations: {
        n8n?: {
            enabled: boolean;
            instanceUrl?: string;
            apiKey?: string;
            webhookBaseUrl?: string;
        };
        webhooks?: {
            enabled: boolean;
            maxRetryAttempts?: number;
            defaultTimeout?: number;
            signatureValidation?: boolean;
        };
        sse?: {
            enabled: boolean;
            heartbeatInterval?: number;
            maxConnections?: number;
            eventPersistence?: boolean;
        };
        websocket?: {
            enabled: boolean;
            port?: number;
            maxConnections?: number;
            roomsEnabled?: boolean;
            compressionEnabled?: boolean;
        };
        web3?: {
            enabled: boolean;
            supportedNetworks?: number[];
            defaultProvider?: string;
            web3authConfig?: Record<string, any>;
        };
        theia?: {
            enabled: boolean;
            workspaceRoot?: string;
            languageServers?: string[];
            mcpIntegration?: boolean;
        };
        claude?: {
            enabled: boolean;
            apiKey?: string;
            defaultModel?: string;
        };
        pydantic?: {
            enabled: boolean;
            strictValidation?: boolean;
            enableSerialization?: boolean;
        };
        streamingHttp?: {
            enabled: boolean;
            defaultTimeout?: number;
            maxConnections?: number;
        };
        langflow?: {
            enabled: boolean;
            instanceUrl?: string;
            apiKey?: string;
            defaultFlowId?: string;
        };
        langchain?: {
            enabled: boolean;
            defaultLLM?: string;
            defaultMemory?: string;
            availableTools?: string[];
        };
    };
    security: {
        requireAuthentication: boolean;
        allowedOrigins?: string[];
        rateLimiting?: {
            enabled: boolean;
            maxRequestsPerMinute?: number;
        };
        encryption?: {
            enabled: boolean;
            algorithm?: string;
        };
    };
    performance: {
        caching: {
            enabled: boolean;
            ttl?: number;
        };
        clustering?: {
            enabled: boolean;
            instances?: number;
        };
        monitoring: {
            enabled: boolean;
            metricsEndpoint?: string;
        };
    };
}
//# sourceMappingURL=index.original.d.ts.map