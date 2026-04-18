/**
 * Compatibility Layer for Drizzle to Drizzle Migration
 *
 * This file provides aliases to maintain backwards compatibility
 * during the migration period. Services can gradually migrate from
 * Drizzle repositories to Drizzle repositories without breaking changes.
 *
 * Usage:
 * ```typescript
 * // Old way (Drizzle)
 * import { UserRepository } from '@the-new-fuse/database';
 *
 * // New way (Drizzle - same import path)
 * import { UserRepository } from '@the-new-fuse/database';
 * // Now points to DrizzleUserRepository
 * ```
 */

import {
  drizzleUserRepository,
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleWorkflowRepository,
} from './repositories/index.js';

/**
 * Repository Aliases for Backwards Compatibility
 *
 * These aliases allow existing code to continue working while
 * gradually migrating from Drizzle to Drizzle.
 */

// User Repository Alias
export const UserRepository = drizzleUserRepository;
export type UserRepository = typeof drizzleUserRepository;

// Agent Repository Alias
export const AgentRepository = drizzleAgentRepository;
export type AgentRepository = typeof drizzleAgentRepository;

// Chat Repository Alias
export const ChatRepository = drizzleChatRepository;
export const ChatMessageRepository = drizzleChatRepository; // Alternative name
export type ChatRepository = typeof drizzleChatRepository;
export type ChatMessageRepository = typeof drizzleChatRepository;

// Task Repository Alias
export const TaskRepository = drizzleTaskRepository;
export type TaskRepository = typeof drizzleTaskRepository;

// Workflow Repository Alias
export const WorkflowRepository = drizzleWorkflowRepository;
export const WorkflowExecutionRepository = drizzleWorkflowRepository; // Alternative name
export type WorkflowRepository = typeof drizzleWorkflowRepository;
export type WorkflowExecutionRepository = typeof drizzleWorkflowRepository;

/**
 * Re-export all Drizzle repositories for direct access
 */
export {
  drizzleUserRepository,
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleWorkflowRepository,
} from './repositories/index.js';

/**
 * Re-export repository classes for type annotations
 */
export {
  DrizzleUserRepository,
  DrizzleAgentRepository,
  DrizzleChatRepository,
  DrizzleTaskRepository,
  DrizzleWorkflowRepository,
} from './repositories/index.js';
