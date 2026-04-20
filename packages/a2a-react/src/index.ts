// Main exports
export { A2AProvider, useA2AContext } from './A2AProvider.js';
export { useA2AAgents } from './hooks/useA2AAgents.js';
export { useA2AConversations } from './hooks/useA2AConversations.js';
export { useA2ADiscovery } from './hooks/useA2ADiscovery.js';
export { useA2AMessages } from './hooks/useA2AMessages.js';
export { useA2A } from './useA2A.js';

// Re-export types from a2a-core
export type { A2AMessage, AgentRegistration } from '@the-new-fuse/a2a-core';

export { A2AMessageType, A2APriority, AgentStatus } from '@the-new-fuse/a2a-core';
