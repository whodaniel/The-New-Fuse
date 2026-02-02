/**
 * TNF CLI - Main Exports
 *
 * A2A Protocol compliant multi-agent orchestration CLI
 */

// Core exports
export * from './circuit-breaker.js';
export * from './config.js';
export * from './logger.js';
export * from './orchestration.js';
export * from './RedisAgentClient.js';
export * from './task-manager.js';
export * from './types.js';

// Version
export const VERSION = '2.0.0';
export const A2A_PROTOCOL_VERSION = '0.3.0';
