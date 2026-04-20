/**
 * @the-new-fuse/jules-skill
 * Jules CLI integration skill for AI agent delegation
 *
 * This package provides:
 * 1. JulesClient - Programmatic interface to Jules CLI
 * 2. MCP Server - Model Context Protocol server for AI agent tools
 * 3. Types - TypeScript definitions for Jules operations
 */

// Export types
export * from './types.js';

// Export client
export { JulesClient, julesClient } from './client.js';

// Re-export for convenience
export type {
  BatchSubmissionResult,
  CreateSessionOptions,
  JulesCommandResult,
  JulesSession,
  JulesSessionStatus,
  JulesTaskTemplate,
  ListSessionsOptions,
  PullSessionOptions,
} from './types.js';
