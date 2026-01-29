/**
 * KIMI Orchestrator - Main entry point
 *
 * Orchestrates up to 100 parallel KIMI k2.5 agents for The New Fuse ecosystem.
 * Provides agent pool management, task distribution, health monitoring,
 * and MCP server integration for Kilo Code.
 */

export { AgentPool } from './AgentPool';
export { HealthMonitor } from './HealthMonitor';
export { KimiOrchestrator } from './KimiOrchestrator';
export { KimiMcpServer } from './mcp-server';
export { TaskDistributor } from './TaskDistributor';

export type {
  AgentHealth,
  AgentPoolStats,
  KimiAgent,
  KimiCapability,
  KimiOrchestratorConfig,
  LoadBalanceConfig,
  McpTool,
  OperationResult,
  OrchestratorEvents,
  TaskAssignment,
  TaskDecomposition,
} from './types';

export { DEFAULT_LOAD_BALANCE_CONFIG, DEFAULT_ORCHESTRATOR_CONFIG } from './constants';

// Version
export const VERSION = '1.0.0';
