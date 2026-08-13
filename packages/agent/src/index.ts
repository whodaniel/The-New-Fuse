// Agent package exports

export {
  AgentProcessor,
  type ProcessorRegistrationOptions,
  type ProcessorRuntimeProcessor,
  type RegisteredProcessor,
} from './core/AgentProcessor.js';
export {
  AgentHarnessExtensionHost,
  type AgentHarnessContext,
  type AgentHarnessExtension,
  type AgentHarnessExtensionRegistration,
} from './core/AgentHarnessExtension.js';

// Registry
export {
  AgentMetadata,
  AgentStatus,
  RedisAgentRegistry,
  type AgentRegistryConfig,
} from './registry/redis-agent-registry.js';
