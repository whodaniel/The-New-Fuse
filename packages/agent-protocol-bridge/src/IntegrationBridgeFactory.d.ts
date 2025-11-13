import { IntegrationBridgeFactory, N8NBridge, N8NBridgeConfig, WebhookBridge, WebhookBridgeConfig, SSEBridge, SSEBridgeConfig, WebSocketBridge, WebSocketBridgeConfig, Web3Bridge, Web3BridgeConfig, TheiaBridge, TheiaBridgeConfig, ClaudeSubAgentBridge, ClaudeBridgeConfig } from './types/integration-bridge-types';
import { AgentHub } from './services/AgentHub';
import { AgentDiscoveryService, AgentDiscoveryOptions } from './services/AgentDiscoveryService';
import { TaskOrchestrator } from './services/TaskOrchestrator';
import { AgentCommunicationBridge, BridgeConfiguration } from './services/AgentCommunicationBridge';
import { A2AService } from '../../core/src/services/A2AService';
import { MCPClient } from '../../core/src/mcp/MCPClient';
import { MessageRouter } from '../../core/src/communication/MessageRouter';
import { ProtobufAdapter } from './adapters/ProtobufAdapter';
export interface AgentHubConfig {
    a2aService?: A2AService;
    mcpClient?: MCPClient;
    /**
     * REQUIRED: A fully-initialized MessageRouter instance.
     * The MessageRouter must be properly constructed with A2AService and MCPService dependencies.
     * This cannot be a stub or placeholder implementation - routing will fail if not properly configured.
     */
    messageRouter?: MessageRouter;
    agentsDirectory?: string;
    discoveryService?: AgentDiscoveryService;
    communicationBridge?: AgentCommunicationBridge;
    /**
     * Optional: Shared ProtobufAdapter instance for consistent protocol handling.
     * If not provided, a new instance will be created for each AgentHub.
     */
    protobufAdapter?: ProtobufAdapter;
    discoveryOptions?: AgentDiscoveryOptions;
    orchestratorOptions?: {
        processingInterval?: number;
        maxConcurrentTasks?: number;
        defaultTimeout?: number;
        maxRetries?: number;
    };
    bridgeConfiguration?: BridgeConfiguration;
}
export interface IntegratedAgentStack {
    agentHub: AgentHub;
    discoveryService: AgentDiscoveryService;
    taskOrchestrator: TaskOrchestrator;
    communicationBridge: AgentCommunicationBridge;
}
export declare class IntegrationBridgeFactoryImplementation implements IntegrationBridgeFactory {
    createN8NBridge(config: N8NBridgeConfig): Promise<N8NBridge>;
    createWebhookBridge(config: WebhookBridgeConfig): Promise<WebhookBridge>;
    createSSEBridge(config: SSEBridgeConfig): Promise<SSEBridge>;
    createWebSocketBridge(config: WebSocketBridgeConfig): Promise<WebSocketBridge>;
    createWeb3Bridge(config: Web3BridgeConfig): Promise<Web3Bridge>;
    createTheiaBridge(config: TheiaBridgeConfig): Promise<TheiaBridge>;
    createClaudeBridge(config: ClaudeBridgeConfig): Promise<ClaudeSubAgentBridge>;
    /**
     * Create an AgentHub instance with proper dependencies
     */
    createAgentHub(config?: AgentHubConfig): Promise<AgentHub>;
    /**
     * Create an AgentDiscoveryService instance
     */
    createAgentDiscoveryService(options?: AgentDiscoveryOptions): Promise<AgentDiscoveryService>;
    /**
     * Create a TaskOrchestrator instance
     */
    createTaskOrchestrator(options?: AgentHubConfig['orchestratorOptions']): Promise<TaskOrchestrator>;
    /**
     * Create an AgentCommunicationBridge instance
     */
    createAgentCommunicationBridge(a2aService?: A2AService, mcpClient?: MCPClient, messageRouter?: MessageRouter, config?: BridgeConfiguration): Promise<AgentCommunicationBridge>;
    /**
     * Create an integrated agent stack with all services properly configured
     */
    createIntegratedAgentStack(config?: AgentHubConfig): Promise<IntegratedAgentStack>;
    /**
     * Wire up services to work together
     */
    private wireServices;
    /**
     * Create a lightweight AgentHub with minimal dependencies
     */
    createSimpleAgentHub(): Promise<AgentHub>;
    /**
     * Create pre-configured services for common use cases
     */
    createA2AService(): Promise<A2AService>;
    createMCPClient(): Promise<MCPClient>;
    createMessageRouter(): Promise<MessageRouter>;
    /**
     * Validate service configuration
     */
    validateConfiguration(config: AgentHubConfig): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=IntegrationBridgeFactory.d.ts.map