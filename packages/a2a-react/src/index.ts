// Core hook
export { useA2A } from './useA2A';
export type { A2AConnectionConfig, A2AConnectionState, A2AHookReturn } from './useA2A';

// Provider and context
export { A2AProvider, useA2AContext, useA2AAgents, useA2AMessages, useA2AConversations } from './A2AProvider';
export type { A2AProviderProps } from './A2AProvider';

// Re-export core types from a2a-core
export type {
  A2AMessage,
  AgentRegistration,
  AgentHeartbeat,
  AgentStatus,
  MessageType,
  Priority,
  A2AError
} from '@the-new-fuse/a2a-core';
