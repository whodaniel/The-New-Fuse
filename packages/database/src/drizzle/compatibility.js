"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleWorkflowRepository = exports.DrizzleTaskRepository = exports.DrizzleChatRepository = exports.DrizzleAgentRepository = exports.DrizzleUserRepository = exports.drizzleWorkflowRepository = exports.drizzleTaskRepository = exports.drizzleChatRepository = exports.drizzleAgentRepository = exports.drizzleUserRepository = exports.WorkflowExecutionRepository = exports.WorkflowRepository = exports.TaskRepository = exports.ChatMessageRepository = exports.ChatRepository = exports.AgentRepository = exports.UserRepository = void 0;
const repositories_1 = require("./repositories");
/**
 * Repository Aliases for Backwards Compatibility
 *
 * These aliases allow existing code to continue working while
 * gradually migrating from Drizzle to Drizzle.
 */
// User Repository Alias
exports.UserRepository = repositories_1.drizzleUserRepository;
// Agent Repository Alias
exports.AgentRepository = repositories_1.drizzleAgentRepository;
// Chat Repository Alias
exports.ChatRepository = repositories_1.drizzleChatRepository;
exports.ChatMessageRepository = repositories_1.drizzleChatRepository; // Alternative name
// Task Repository Alias
exports.TaskRepository = repositories_1.drizzleTaskRepository;
// Workflow Repository Alias
exports.WorkflowRepository = repositories_1.drizzleWorkflowRepository;
exports.WorkflowExecutionRepository = repositories_1.drizzleWorkflowRepository; // Alternative name
/**
 * Re-export all Drizzle repositories for direct access
 */
var repositories_2 = require("./repositories");
Object.defineProperty(exports, "drizzleUserRepository", { enumerable: true, get: function () { return repositories_2.drizzleUserRepository; } });
Object.defineProperty(exports, "drizzleAgentRepository", { enumerable: true, get: function () { return repositories_2.drizzleAgentRepository; } });
Object.defineProperty(exports, "drizzleChatRepository", { enumerable: true, get: function () { return repositories_2.drizzleChatRepository; } });
Object.defineProperty(exports, "drizzleTaskRepository", { enumerable: true, get: function () { return repositories_2.drizzleTaskRepository; } });
Object.defineProperty(exports, "drizzleWorkflowRepository", { enumerable: true, get: function () { return repositories_2.drizzleWorkflowRepository; } });
/**
 * Re-export repository classes for type annotations
 */
var repositories_3 = require("./repositories");
Object.defineProperty(exports, "DrizzleUserRepository", { enumerable: true, get: function () { return repositories_3.DrizzleUserRepository; } });
Object.defineProperty(exports, "DrizzleAgentRepository", { enumerable: true, get: function () { return repositories_3.DrizzleAgentRepository; } });
Object.defineProperty(exports, "DrizzleChatRepository", { enumerable: true, get: function () { return repositories_3.DrizzleChatRepository; } });
Object.defineProperty(exports, "DrizzleTaskRepository", { enumerable: true, get: function () { return repositories_3.DrizzleTaskRepository; } });
Object.defineProperty(exports, "DrizzleWorkflowRepository", { enumerable: true, get: function () { return repositories_3.DrizzleWorkflowRepository; } });
//# sourceMappingURL=compatibility.js.map