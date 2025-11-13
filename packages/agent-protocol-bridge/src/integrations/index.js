"use strict";
/**
 * Integration Systems Types Export
 *
 * Comprehensive export of all integration system types
 * for The New Fuse AI Agent framework.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationUtils = exports.THEIA_SUPPORTED_LANGUAGES = exports.WEBSOCKET_ROOM_TYPES = exports.SSE_CHANNEL_PATTERNS = exports.WEBHOOK_EVENT_TYPES = exports.SUPPORTED_NETWORKS = exports.INTEGRATION_TYPES = void 0;
// N8N Workflow Integration
__exportStar(require("./n8n-types"), exports);
// Webhook System Integration
__exportStar(require("./webhook-types"), exports);
// Server-Sent Events Integration
__exportStar(require("./sse-types"), exports);
// WebSocket Real-Time Communication
__exportStar(require("./websocket-types"), exports);
// Blockchain/Web3 Integration
__exportStar(require("./web3-types"), exports);
// Theia IDE Integration
__exportStar(require("./theia-types"), exports);
// Claude Sub-Agent Integration
__exportStar(require("./claude-subagent-types"), exports);
// Pydantic Agent Protocol Integration
__exportStar(require("./pydantic-types"), exports);
// Streaming HTTP Integration
__exportStar(require("./streaming-http-types"), exports);
// LangFlow Integration
__exportStar(require("./langflow-types"), exports);
// Langchain Integration
__exportStar(require("./langchain-types"), exports);
// Common Types
__exportStar(require("../types/common-types"), exports);
// Integration Constants
exports.INTEGRATION_TYPES = [
    'N8N_WORKFLOW',
    'WEBHOOK_SYSTEM',
    'SSE_EVENTS',
    'WEBSOCKET_REALTIME',
    'WEB3_BLOCKCHAIN',
    'THEIA_IDE',
    'CLAUDE_SUB_AGENT',
    'STREAMING_HTTP',
    'LANGFLOW',
    'LANGCHAIN'
];
exports.SUPPORTED_NETWORKS = [
    // Ethereum networks
    { chainId: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
    { chainId: 5, name: 'Ethereum Goerli', symbol: 'ETH' },
    { chainId: 11155111, name: 'Ethereum Sepolia', symbol: 'ETH' },
    // Polygon networks
    { chainId: 137, name: 'Polygon Mainnet', symbol: 'MATIC' },
    { chainId: 80001, name: 'Polygon Mumbai', symbol: 'MATIC' },
    // Binance Smart Chain
    { chainId: 56, name: 'BSC Mainnet', symbol: 'BNB' },
    { chainId: 97, name: 'BSC Testnet', symbol: 'BNB' },
    // Arbitrum
    { chainId: 42161, name: 'Arbitrum One', symbol: 'ETH' },
    { chainId: 421613, name: 'Arbitrum Goerli', symbol: 'ETH' },
    // Optimism
    { chainId: 10, name: 'Optimism Mainnet', symbol: 'ETH' },
    { chainId: 420, name: 'Optimism Goerli', symbol: 'ETH' },
    // Avalanche
    { chainId: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX' },
    { chainId: 43113, name: 'Avalanche Fuji', symbol: 'AVAX' }
];
exports.WEBHOOK_EVENT_TYPES = [
    // Agent events
    'agent.created',
    'agent.updated',
    'agent.deleted',
    'agent.status.changed',
    'agent.task.started',
    'agent.task.completed',
    'agent.task.failed',
    'agent.message.sent',
    'agent.message.received',
    'agent.error.occurred',
    // Workflow events
    'workflow.started',
    'workflow.completed',
    'workflow.failed',
    'workflow.paused',
    'workflow.resumed',
    'workflow.step.completed',
    'workflow.step.failed',
    // N8N events
    'n8n.workflow.triggered',
    'n8n.workflow.completed',
    'n8n.workflow.failed',
    'n8n.execution.started',
    'n8n.execution.finished',
    // System events
    'system.startup',
    'system.shutdown',
    'system.maintenance.started',
    'system.maintenance.completed',
    'system.upgrade.started',
    'system.upgrade.completed',
    'system.alert.critical',
    'system.alert.warning',
    'system.alert.info',
    // User events
    'user.registered',
    'user.login',
    'user.logout',
    'user.profile.updated',
    'user.notification.sent',
    'user.session.expired',
    // Integration events
    'webhook.delivered',
    'webhook.failed',
    'sse.connected',
    'sse.disconnected',
    'websocket.connected',
    'websocket.disconnected',
    'web3.transaction.submitted',
    'web3.transaction.confirmed',
    'web3.transaction.failed',
    'web3.contract.deployed',
    'web3.contract.interaction',
    'theia.workspace.opened',
    'theia.workspace.closed',
    'theia.file.created',
    'theia.file.modified',
    'theia.file.deleted',
    'theia.command.executed'
];
exports.SSE_CHANNEL_PATTERNS = [
    // User channels
    'user.{userId}',
    'user.{userId}.notifications',
    'user.{userId}.agents',
    'user.{userId}.workflows',
    // Agent channels
    'agent.{agentId}',
    'agent.{agentId}.status',
    'agent.{agentId}.tasks',
    'agent.{agentId}.messages',
    // Organization channels
    'org.{organizationId}',
    'org.{organizationId}.users',
    'org.{organizationId}.agents',
    'org.{organizationId}.alerts',
    // System channels
    'system.alerts',
    'system.maintenance',
    'system.updates',
    // Integration channels
    'integrations.n8n',
    'integrations.webhooks',
    'integrations.web3',
    'integrations.theia',
    // Workflow channels
    'workflows.{workflowId}',
    'workflows.{workflowId}.steps',
    'workflows.{workflowId}.logs'
];
exports.WEBSOCKET_ROOM_TYPES = [
    'USER_PRIVATE',
    'AGENT_PRIVATE',
    'PROJECT_TEAM',
    'ORGANIZATION_WIDE',
    'PUBLIC_CHAT',
    'DEBUG_SESSION',
    'COLLABORATION',
    'WORKFLOW_MONITORING',
    'SYSTEM_MONITORING'
];
exports.THEIA_SUPPORTED_LANGUAGES = [
    // Popular languages
    'javascript',
    'typescript',
    'python',
    'java',
    'rust',
    'go',
    'cpp',
    'c',
    'csharp',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'scala',
    'dart',
    'r',
    'julia',
    // Web technologies
    'html',
    'css',
    'scss',
    'less',
    'vue',
    'svelte',
    // Configuration/markup
    'json',
    'yaml',
    'toml',
    'xml',
    'markdown',
    'dockerfile',
    'makefile',
    // Shell scripting
    'bash',
    'powershell',
    'fish',
    'zsh',
    // Database
    'sql',
    'postgresql',
    'mysql',
    'mongodb',
    // Other
    'latex',
    'graphql',
    'protobuf'
];
// Integration utility functions
class IntegrationUtils {
    /**
     * Check if a network is supported
     */
    static isSupportedNetwork(chainId) {
        return exports.SUPPORTED_NETWORKS.some(network => network.chainId === chainId);
    }
    /**
     * Get network info by chain ID
     */
    static getNetworkInfo(chainId) {
        return exports.SUPPORTED_NETWORKS.find(network => network.chainId === chainId);
    }
    /**
     * Validate webhook event type
     */
    static isValidWebhookEvent(eventType) {
        return exports.WEBHOOK_EVENT_TYPES.includes(eventType);
    }
    /**
     * Parse SSE channel pattern
     */
    static parseChannelPattern(pattern, variables) {
        return pattern.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
    }
    /**
     * Check if language is supported in Theia
     */
    static isLanguageSupported(language) {
        return exports.THEIA_SUPPORTED_LANGUAGES.includes(language);
    }
    /**
     * Generate unique integration ID
     */
    static generateIntegrationId(type, identifier) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${type.toLowerCase()}_${identifier || 'default'}_${timestamp}_${random};
  }
  
  /**
   * Validate webhook URL
   */
  static isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  
  /**
   * Sanitize file path for Theia
   */
  static sanitizeFilePath(path: string): string {
    return path
      .replace(/[^\w\-_./]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/\/+/g, '/')
      .replace(/^\/+|\/+$/g, '');
  }
  
  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes: bigint | number): string {
    const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (size === 0) return '0 B';
    
    const k = 1024;`;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        `
    const i = Math.floor(Math.log(size) / Math.log(k));`;
        return $;
        {
            parseFloat((size / Math.pow(k, i)).toFixed(2));
        }
        $;
        {
            sizes[i];
        }
        ;
    }
}
exports.IntegrationUtils = IntegrationUtils;
// This would use crypto in a real implementation`
return $;
{
    algorithm;
}
signature_placeholder_$;
{
    payload.length;
}
_$;
{
    secret.length;
}
`;
  }
}

// Type guards for integration system detection
export class IntegrationTypeGuards {
  static isN8NWorkflow(obj: any): obj is import('./n8n-types').N8NWorkflowConfig {
    return obj && typeof obj.workflowId === 'string' && typeof obj.n8nInstanceUrl === 'string';
  }
  
  static isWebhookConfig(obj: any): obj is import('./webhook-types').WebhookConfiguration {
    return obj && typeof obj.url === 'string' && Array.isArray(obj.eventTypes);
  }
  
  static isSseEvent(obj: any): obj is import('./sse-types').SseEvent {
    return obj && typeof obj.type === 'string' && typeof obj.data === 'object';
  }
  
  static isWebSocketMessage(obj: any): obj is import('./websocket-types').WebSocketMessage {
    return obj && typeof obj.type === 'string' && typeof obj.connectionId === 'string';
  }
  
  static isWeb3Account(obj: any): obj is import('./web3-types').Web3Account {
    return obj && typeof obj.address === 'string' && typeof obj.chainId === 'number';
  }
  
  static isTheiaWorkspace(obj: any): obj is import('./theia-types').TheiaWorkspace {
    return obj && typeof obj.rootPath === 'string' && typeof obj.uri === 'string';
  }
};
//# sourceMappingURL=index.js.map