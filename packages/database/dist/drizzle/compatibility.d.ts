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
import { drizzleUserRepository, drizzleAgentRepository, drizzleChatRepository, drizzleTaskRepository, drizzleWorkflowRepository } from './repositories.js';
/**
 * Repository Aliases for Backwards Compatibility
 *
 * These aliases allow existing code to continue working while
 * gradually migrating from Drizzle to Drizzle.
 */
export declare const UserRepository: import("./repositories.js").DrizzleUserRepository;
export type UserRepository = typeof drizzleUserRepository;
export declare const AgentRepository: import("./repositories.js").DrizzleAgentRepository;
export type AgentRepository = typeof drizzleAgentRepository;
export declare const ChatRepository: import("./repositories.js").DrizzleChatRepository;
export declare const ChatMessageRepository: import("./repositories.js").DrizzleChatRepository;
export type ChatRepository = typeof drizzleChatRepository;
export type ChatMessageRepository = typeof drizzleChatRepository;
export declare const TaskRepository: import("./repositories.js").DrizzleTaskRepository;
export type TaskRepository = typeof drizzleTaskRepository;
export declare const WorkflowRepository: import("./repositories.js").DrizzleWorkflowRepository;
export declare const WorkflowExecutionRepository: import("./repositories.js").DrizzleWorkflowRepository;
export type WorkflowRepository = typeof drizzleWorkflowRepository;
export type WorkflowExecutionRepository = typeof drizzleWorkflowRepository;
/**
 * Re-export all Drizzle repositories for direct access
 */
export { drizzleUserRepository, drizzleAgentRepository, drizzleChatRepository, drizzleTaskRepository, drizzleWorkflowRepository, } from './repositories.js';
/**
 * Re-export repository classes for type annotations
 */
export { DrizzleUserRepository, DrizzleAgentRepository, DrizzleChatRepository, DrizzleTaskRepository, DrizzleWorkflowRepository, } from './repositories.js';
//# sourceMappingURL=compatibility.d.ts.map