/**
 * Core module exports
 * Centralizes all core type exports for easy importing
 */

// Export all types and interfaces
export * from './base-types.js';
export * from './enums.js';
export * from './interfaces.js';
export { AgentRole as AgentRoleInterface } from './interfaces.js';

export * from './dtos.js';
export * from './services.js';

// Export agent types separately to avoid conflicts
export type { AgentCapability as CoreAgentCapability } from './agent.js';
export type { AgentMessage, AgentConfig } from './agent.js';