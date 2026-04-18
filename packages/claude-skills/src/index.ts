/**
 * Claude Skills Package
 *
 * Integration layer for Anthropic's Claude Skills into The New Fuse
 */

// Core types
export * from './types';

// Parser
export { SkillParser } from './parser';

// Loader
export { SkillLoader } from './loader';

// Executor
export { SkillExecutor } from './executor';

// Registry
export { SkillRegistry } from './registry';

// MCP Integration
export { MCPSkillProvider } from './integration';

// Main orchestrator
export { ClaudeSkillsManager } from './ClaudeSkillsManager';

// Package metadata
export const VERSION = '1.0.0';
export const PACKAGE_INFO = {
  name: '@the-new-fuse/claude-skills',
  version: VERSION,
  description: 'Integration layer for Anthropic Claude Skills into The New Fuse',
  author: 'The New Fuse Team',
  license: 'MIT',
} as const;
