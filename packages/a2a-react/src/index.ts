// Main exports
export { A2AProvider } from './A2AProvider';
export { useA2AContext } from './A2AProvider';
export { useA2A } from './useA2A';
export { useA2AAgents } from './hooks/useA2AAgents';
export { useA2AMessages } from './hooks/useA2AMessages';
export { useA2AConversations } from './hooks/useA2AConversations';
export { useA2ADiscovery } from './hooks/useA2ADiscovery';

// Re-export types from a2a-core
export type {
  A2AMessage,
  AgentRegistration,
  A2AMessageType,
  A2APriority,
  AgentStatus
} from '@the-new-fuse/a2a-core';