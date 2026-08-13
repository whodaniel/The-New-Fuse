/**
 * Claude Skills Package
 *
 * Integration layer for Anthropic's Claude Skills into The New Fuse
 */

// Core types
export * from './types/index.js';

// Parser
export { SkillParser } from './parser.js';

// Loader
export { SkillLoader } from './loader.js';

// Executor
export { SkillExecutor } from './executor.js';

// Registry
export { SkillRegistry } from './registry.js';

// MCP Integration
export { MCPSkillProvider } from './integration.js';

// Main orchestrator
export { ClaudeSkillsManager } from './ClaudeSkillsManager.js';

// Package metadata
export const VERSION = '1.0.0';
export const PACKAGE_INFO = {
  name: '@the-new-fuse/claude-skills',
  version: VERSION,
  description: 'Integration layer for Anthropic Claude Skills into The New Fuse',
  author: 'The New Fuse Team',
  license: 'MIT',
} as const;
