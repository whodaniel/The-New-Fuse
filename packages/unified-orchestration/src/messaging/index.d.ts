/**
 * Unified Messaging System - Public API
 *
 * This module exports all messaging-related types, classes, and utilities
 * for the unified orchestration system.
 */
export * from './UnifiedMessageTypes';
export { MessageRouter } from './MessageRouter';
export type { RoutingRule, RoutingMetrics, MessageRouterEvents } from './MessageRouter';
export { WebSocketAdapter, RedisAdapter, HTTPAdapter, FileAdapter, DirectAdapter } from './ProtocolAdapter';
export type { ProtocolAdapter, ProtocolAdapterEvents } from './ProtocolAdapter';
export { CLIAgentAdapter, WorkflowEngineAdapter, SyncSystemAdapter, TaskManagementAdapter, createLegacyMessageMappings, detectLegacyMessageFormat } from './LegacyMessageAdapters';
export type { UnifiedMessage, MessageEnvelope, MessageBatch, MessageType, MessageProtocol, MessagePriority, MessageStatus, TaskRequestMessage, TaskResponseMessage, TaskProgressMessage, AgentRegistrationMessage, WorkflowMessage, HandoffMessage, SyncMessage, LegacyMessageMappings, MessageProcessingConfig } from './UnifiedMessageTypes';
//# sourceMappingURL=index.d.ts.map