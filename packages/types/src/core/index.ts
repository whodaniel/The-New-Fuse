/**
 * Core module exports
 * Centralizes all core type exports for easy importing
 */

// Export all types and interfaces
export * from './base-types';
export * from './enums';
export * from './interfaces';
export { AgentRole as AgentRoleInterface } from './interfaces';

export * from './dtos';
export * from './services';

// Export agent types separately to avoid conflicts
export type { AgentConfig, AgentMessage, AgentCapability as CoreAgentCapability } from './agent';
