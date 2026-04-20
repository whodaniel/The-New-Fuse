// Sync-Aware A2A Message Types and Utilities
export * from './SyncAwareA2AMessage.js';

// Core Messaging Services
export * from './SyncAwareAgentWebSocketService.js';
export * from './MessageQueueSynchronizer.js';
export * from './CommunicationHubFailover.js';
export * from './SyncAwareMessagingService.js';

// Re-export for convenience
export {
  SyncAwareA2AMessage,
  SyncAwareA2AMessageV1,
  SyncAwareA2AMessageV2,
  SyncMetadata,
  MessageSyncStatus,
  CrossTenantRoutingConfig,
  MessageQueueSyncConfig,
  MessageFailoverConfig,
  MessageDeliveryMetrics,
  SyncAwareMessageUtils
} from './SyncAwareA2AMessage.js';

export {
  SyncAwareAgentWebSocketService,
  type IAgentWebSocketService,
  type SyncAwareWebSocketConfig
} from './SyncAwareAgentWebSocketService.js';

export {
  MessageQueueSynchronizer,
  type QueueSyncMetrics,
  type QueueConflict
} from './MessageQueueSynchronizer.js';

export {
  CommunicationHubFailover,
  type CommunicationNode,
  type FailoverEvent,
  type CircuitBreakerState
} from './CommunicationHubFailover.js';

export {
  SyncAwareMessagingService,
  type MessagingServiceConfig,
  type MessagingMetrics
} from './SyncAwareMessagingService.js';