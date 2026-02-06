/**
 * Compatibility Layer for legacy ORM migration to Drizzle
 *
 * This file provides aliases to maintain backwards compatibility
 * during the migration period. Services can gradually migrate from
 * legacy ORM repositories to Drizzle repositories without breaking changes.
 *
 * Usage:
 * ```typescript
 * // Old way (legacy ORM)
 * import { UserRepository } from '@the-new-fuse/database';
 *
 * // New way (Drizzle - same import path)
 * import { UserRepository } from '@the-new-fuse/database';
 * // Now points to DrizzleUserRepository
 * ```
 */

import {
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
} from './repositories';

/**
 * Repository Aliases for Backwards Compatibility
 *
 * These aliases allow existing code to continue working while
 * gradually migrating from a legacy ORM to Drizzle.
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
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
} from './repositories';

/**
 * Re-export repository classes for type annotations
 */
export {
  DrizzleAgentRepository,
  DrizzleChatRepository,
  DrizzleTaskRepository,
  DrizzleUserRepository,
  DrizzleWorkflowRepository,
} from './repositories';
