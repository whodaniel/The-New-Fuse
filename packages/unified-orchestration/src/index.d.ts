/**
 * The New Fuse - Unified Orchestration System
 *
 * This is the main entry point for the unified orchestration package,
 * providing a complete solution for multi-agent coordination, messaging,
 * and workflow management.
 */
export * from './types/UnifiedAgentTypes';
export { UnifiedAgentRegistry } from './registry/UnifiedAgentRegistry';
export type { AgentRegistryEvents, AgentRegistrationOptions, AgentQueryOptions } from './registry/UnifiedAgentRegistry';
export { MasterOrchestrator } from './orchestration/MasterOrchestrator';
export type { MasterOrchestrationRequest, MasterOrchestrationResult, CoordinationStrategy, MasterOrchestratorEvents } from './orchestration/MasterOrchestrator';
export * from './messaging';
export type { UnifiedOrchestrationConfig, AgentRegistryConfig, MessageProcessingConfig } from './types/UnifiedAgentTypes';
export { createDefaultConfig, validateAgentConfiguration, calculateAgentScore, mergeConfigurations } from './utils/ConfigUtils';
export declare const VERSION = "1.0.0";
export declare const BUILD_DATE: string;
//# sourceMappingURL=index.d.ts.map