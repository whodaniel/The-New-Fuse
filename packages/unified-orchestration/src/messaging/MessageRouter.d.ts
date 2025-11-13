/**
 * Message Router for Unified Orchestration
 *
 * This module provides intelligent routing of messages across different protocols
 * and agent systems, with load balancing, failover, and performance optimization.
 */
import { EventEmitter } from 'eventemitter3';
import { UnifiedMessage, MessageEnvelope, MessageBatch, MessageProtocol, MessageProcessingConfig, LegacyMessageMappings } from './UnifiedMessageTypes';
export interface RoutingRule {
    id: string;
    name: string;
    condition: (message: UnifiedMessage) => boolean;
    action: {
        type: 'route' | 'transform' | 'filter' | 'broadcast' | 'queue';
        target?: string;
        transform?: (message: UnifiedMessage) => UnifiedMessage;
        priority?: number;
    };
    enabled: boolean;
}
export interface RoutingMetrics {
    messagesRouted: number;
    messagesFailed: number;
    averageLatency: number;
    protocolStats: Record<MessageProtocol, {
        sent: number;
        received: number;
        failed: number;
    }>;
    routingRuleStats: Record<string, {
        applied: number;
        successful: number;
        failed: number;
    }>;
}
export interface MessageRouterEvents {
    'message:received': (envelope: MessageEnvelope) => void;
    'message:routed': (envelope: MessageEnvelope, target: string) => void;
    'message:failed': (envelope: MessageEnvelope, error: Error) => void;
    'message:queued': (envelope: MessageEnvelope) => void;
    'routing:rule-applied': (rule: RoutingRule, message: UnifiedMessage) => void;
    'metrics:updated': (metrics: RoutingMetrics) => void;
}
export declare class MessageRouter extends EventEmitter<MessageRouterEvents> {
    private config;
    private agentRegistry;
    private routingRules;
    private messageQueue;
    private metrics;
    private protocolAdapters;
    private legacyMappings?;
    private messageCache;
    constructor(config: MessageProcessingConfig, agentRegistry: any, // UnifiedAgentRegistry
    legacyMappings?: LegacyMessageMappings);
    /**
     * Add a custom routing rule
     */
    addRoutingRule(rule: RoutingRule): void;
    /**
     * Remove a routing rule
     */
    removeRoutingRule(ruleId: string): boolean;
    /**
     * Route a message through the system
     */
    routeMessage(envelope: MessageEnvelope): Promise<void>;
    /**
     * Route multiple messages as a batch
     */
    routeBatch(batch: MessageBatch): Promise<void>;
    /**
     * Get routing metrics
     */
    getMetrics(): RoutingMetrics;
    /**
     * Clear routing metrics
     */
    clearMetrics(): void;
    /**
     * Register a protocol adapter
     */
    registerProtocolAdapter(protocol: MessageProtocol, adapter: any): void;
    /**
     * Convert legacy message format to unified format
     */
    convertLegacyMessage(legacyMessage: any, sourceFormat: string): UnifiedMessage;
    private validateMessage;
    private isMessageCached;
    private cacheMessage;
    private cleanupCache;
    private getApplicableRules;
    private applyRoutingRule;
    private performDefaultRouting;
    private routeToTarget;
    private routeByCapabilities;
}
//# sourceMappingURL=MessageRouter.d.ts.map