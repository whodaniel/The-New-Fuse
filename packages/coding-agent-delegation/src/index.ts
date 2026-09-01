/**
 * @the-new-fuse/coding-agent-delegation
 * Remote coding-agent delegation for TNF agents (Google Jules as first provider)
 *
 * This package provides:
 * 1. JulesClient - Programmatic interface to the Jules CLI (a RemoteCodingAgentClient impl)
 * 2. MCP Server - Standalone Model Context Protocol server for AI agent tools
 * 3. Types - TypeScript definitions incl. the provider-agnostic RemoteCodingAgentClient surface
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
