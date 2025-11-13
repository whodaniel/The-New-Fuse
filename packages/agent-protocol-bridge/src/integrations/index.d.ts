/**
 * Integration Systems Types Export
 *
 * Comprehensive export of all integration system types
 * for The New Fuse AI Agent framework.
 */
export * from './n8n-types';
export * from './webhook-types';
export * from './sse-types';
export * from './websocket-types';
export * from './web3-types';
export * from './theia-types';
export * from './claude-subagent-types';
export * from './pydantic-types';
export * from './streaming-http-types';
export * from './langflow-types';
export * from './langchain-types';
export * from '../types/common-types';
export declare const INTEGRATION_TYPES: readonly ["N8N_WORKFLOW", "WEBHOOK_SYSTEM", "SSE_EVENTS", "WEBSOCKET_REALTIME", "WEB3_BLOCKCHAIN", "THEIA_IDE", "CLAUDE_SUB_AGENT", "STREAMING_HTTP", "LANGFLOW", "LANGCHAIN"];
export declare const SUPPORTED_NETWORKS: readonly [{
    readonly chainId: 1;
    readonly name: "Ethereum Mainnet";
    readonly symbol: "ETH";
}, {
    readonly chainId: 5;
    readonly name: "Ethereum Goerli";
    readonly symbol: "ETH";
}, {
    readonly chainId: 11155111;
    readonly name: "Ethereum Sepolia";
    readonly symbol: "ETH";
}, {
    readonly chainId: 137;
    readonly name: "Polygon Mainnet";
    readonly symbol: "MATIC";
}, {
    readonly chainId: 80001;
    readonly name: "Polygon Mumbai";
    readonly symbol: "MATIC";
}, {
    readonly chainId: 56;
    readonly name: "BSC Mainnet";
    readonly symbol: "BNB";
}, {
    readonly chainId: 97;
    readonly name: "BSC Testnet";
    readonly symbol: "BNB";
}, {
    readonly chainId: 42161;
    readonly name: "Arbitrum One";
    readonly symbol: "ETH";
}, {
    readonly chainId: 421613;
    readonly name: "Arbitrum Goerli";
    readonly symbol: "ETH";
}, {
    readonly chainId: 10;
    readonly name: "Optimism Mainnet";
    readonly symbol: "ETH";
}, {
    readonly chainId: 420;
    readonly name: "Optimism Goerli";
    readonly symbol: "ETH";
}, {
    readonly chainId: 43114;
    readonly name: "Avalanche C-Chain";
    readonly symbol: "AVAX";
}, {
    readonly chainId: 43113;
    readonly name: "Avalanche Fuji";
    readonly symbol: "AVAX";
}];
export declare const WEBHOOK_EVENT_TYPES: readonly ["agent.created", "agent.updated", "agent.deleted", "agent.status.changed", "agent.task.started", "agent.task.completed", "agent.task.failed", "agent.message.sent", "agent.message.received", "agent.error.occurred", "workflow.started", "workflow.completed", "workflow.failed", "workflow.paused", "workflow.resumed", "workflow.step.completed", "workflow.step.failed", "n8n.workflow.triggered", "n8n.workflow.completed", "n8n.workflow.failed", "n8n.execution.started", "n8n.execution.finished", "system.startup", "system.shutdown", "system.maintenance.started", "system.maintenance.completed", "system.upgrade.started", "system.upgrade.completed", "system.alert.critical", "system.alert.warning", "system.alert.info", "user.registered", "user.login", "user.logout", "user.profile.updated", "user.notification.sent", "user.session.expired", "webhook.delivered", "webhook.failed", "sse.connected", "sse.disconnected", "websocket.connected", "websocket.disconnected", "web3.transaction.submitted", "web3.transaction.confirmed", "web3.transaction.failed", "web3.contract.deployed", "web3.contract.interaction", "theia.workspace.opened", "theia.workspace.closed", "theia.file.created", "theia.file.modified", "theia.file.deleted", "theia.command.executed"];
export declare const SSE_CHANNEL_PATTERNS: readonly ["user.{userId}", "user.{userId}.notifications", "user.{userId}.agents", "user.{userId}.workflows", "agent.{agentId}", "agent.{agentId}.status", "agent.{agentId}.tasks", "agent.{agentId}.messages", "org.{organizationId}", "org.{organizationId}.users", "org.{organizationId}.agents", "org.{organizationId}.alerts", "system.alerts", "system.maintenance", "system.updates", "integrations.n8n", "integrations.webhooks", "integrations.web3", "integrations.theia", "workflows.{workflowId}", "workflows.{workflowId}.steps", "workflows.{workflowId}.logs"];
export declare const WEBSOCKET_ROOM_TYPES: readonly ["USER_PRIVATE", "AGENT_PRIVATE", "PROJECT_TEAM", "ORGANIZATION_WIDE", "PUBLIC_CHAT", "DEBUG_SESSION", "COLLABORATION", "WORKFLOW_MONITORING", "SYSTEM_MONITORING"];
export declare const THEIA_SUPPORTED_LANGUAGES: readonly ["javascript", "typescript", "python", "java", "rust", "go", "cpp", "c", "csharp", "php", "ruby", "swift", "kotlin", "scala", "dart", "r", "julia", "html", "css", "scss", "less", "vue", "svelte", "json", "yaml", "toml", "xml", "markdown", "dockerfile", "makefile", "bash", "powershell", "fish", "zsh", "sql", "postgresql", "mysql", "mongodb", "latex", "graphql", "protobuf"];
export declare class IntegrationUtils {
    /**
     * Check if a network is supported
     */
    static isSupportedNetwork(chainId: number): boolean;
    /**
     * Get network info by chain ID
     */
    static getNetworkInfo(chainId: number): {
        readonly chainId: 1;
        readonly name: "Ethereum Mainnet";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 5;
        readonly name: "Ethereum Goerli";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 11155111;
        readonly name: "Ethereum Sepolia";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 137;
        readonly name: "Polygon Mainnet";
        readonly symbol: "MATIC";
    } | {
        readonly chainId: 80001;
        readonly name: "Polygon Mumbai";
        readonly symbol: "MATIC";
    } | {
        readonly chainId: 56;
        readonly name: "BSC Mainnet";
        readonly symbol: "BNB";
    } | {
        readonly chainId: 97;
        readonly name: "BSC Testnet";
        readonly symbol: "BNB";
    } | {
        readonly chainId: 42161;
        readonly name: "Arbitrum One";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 421613;
        readonly name: "Arbitrum Goerli";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 10;
        readonly name: "Optimism Mainnet";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 420;
        readonly name: "Optimism Goerli";
        readonly symbol: "ETH";
    } | {
        readonly chainId: 43114;
        readonly name: "Avalanche C-Chain";
        readonly symbol: "AVAX";
    } | {
        readonly chainId: 43113;
        readonly name: "Avalanche Fuji";
        readonly symbol: "AVAX";
    } | undefined;
    /**
     * Validate webhook event type
     */
    static isValidWebhookEvent(eventType: string): boolean;
    /**
     * Parse SSE channel pattern
     */
    static parseChannelPattern(pattern: string, variables: Record<string, string>): string;
    /**
     * Check if language is supported in Theia
     */
    static isLanguageSupported(language: string): boolean;
    /**
     * Generate unique integration ID
     */
    static generateIntegrationId(type: string, identifier?: string): string;
    /**
     * Generate webhook signature
     */
    static generateWebhookSignature(payload: string, secret: string, algorithm?: 'sha256' | 'sha1'): any;
}
//# sourceMappingURL=index.d.ts.map