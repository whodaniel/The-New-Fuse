// Main exports
export { A2AProvider, useA2AContext } from './A2AProvider';
export { useA2AAgents } from './hooks/useA2AAgents';
export { useA2AConversations } from './hooks/useA2AConversations';
export { useA2ADiscovery } from './hooks/useA2ADiscovery';
export { useA2AMessages } from './hooks/useA2AMessages';
export { useA2A } from './useA2A';

// Re-export types from a2a-core
export type {
  A2AMessage,
  A2AMessageType,
  A2APriority,
  AgentRegistration,
  AgentStatus,
} from '@the-new-fuse/a2a-core';
