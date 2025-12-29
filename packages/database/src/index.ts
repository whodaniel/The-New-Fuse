/**
 * This file serves as the main entry point for the database package.
 * It exports both Prisma (for backward compatibility) and Drizzle ORM modules.
 *
 * Migration Strategy:
 * 1. Prisma exports are kept for existing code during migration
 * 2. Drizzle exports are available for new code and gradual migration
 * 3. Once migration is complete, Prisma exports can be removed
 */

// =============================================================================
// PRISMA EXPORTS (Backward Compatibility - Will be deprecated)
// =============================================================================

// Export core types and client from our custom types file
export type {
  Agent,
  Task,
  // Core models
  User,
  // Workflow models
  Workflow,
  WorkflowExecution,
} from './types';

export {
  AgentStatus,
  AgentType,
  Prisma,
  // Prisma client and namespace
  PrismaClient,
  TaskPriority,
  TaskStatus,
  // Enums
  UserRole,
  WorkflowExecutionStatus,
  WorkflowStatus,
} from './types';

// Export database module and services (Prisma-based)
export * from './database.module';
export * from './prisma.service';

// Export Prisma repositories
export * from './repositories/agent.repository';
export * from './repositories/base.repository';
export * from './repositories/chat-message.repository';
export * from './repositories/task.repository';
export * from './repositories/user.repository';
export * from './repositories/workflow-execution.repository';
export * from './repositories/workflow.repository';

// =============================================================================
// DRIZZLE ORM EXPORTS (New - Recommended for new code)
// =============================================================================

// Export Drizzle client, module, and schema
export {
  DRIZZLE_CLIENT,
  DrizzleModule,
  DrizzleService,
  db,
  queryClient,
  schema,
  type Database,
  type DrizzleClient,
  type DrizzleModuleOptions,
  type Transaction,
} from './drizzle';

// Export Drizzle schema tables (prefixed to avoid conflicts with Prisma types)
export * as drizzleSchema from './drizzle/schema';

// Export commonly used schema tables directly for convenience
export {
  agentCapabilityRegistry,
  agentDirectoryEntries,
  agentMetrics,
  agentNfts,
  agentOnboardingEvents,
  agentRegistrations,
  agents,
  chatRoomParticipants,
  chatRooms,
  fractionalShares,
  marketplaceListings,
  marketplaceOffers,
  messages,
  notifications,
  revenueDistributions,
  revenueStreams,
  users,
} from './drizzle/schema';

// Export Drizzle inferred types (prefixed with 'Drizzle' to avoid conflicts)
export type {
  Agent as DrizzleAgent,
  Chat as DrizzleChat,
  ChatMessage as DrizzleChatMessage,
  Message as DrizzleMessage,
  Task as DrizzleTask,
  User as DrizzleUser,
  Workflow as DrizzleWorkflow,
  WorkflowExecution as DrizzleWorkflowExecution,
  NewAgent,
  NewChat,
  NewChatMessage,
  NewMessage,
  NewTask,
  NewUser,
  NewWorkflow,
  NewWorkflowExecution,
} from './drizzle/types';

// Export Drizzle repositories
export {
  DrizzleAgentRepository,
  DrizzleChatRepository,
  DrizzleTaskRepository,
  DrizzleUserRepository,
  DrizzleWorkflowRepository,
  agentNftRepository,
  agentPromptVersionRepository,
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
  fractionalShareRepository,
  optimizationJobRepository,
  revenueDistributionRepository,
  revenueStreamRepository,
  validationDatasetRepository,
  workflowTopologyRepository,
} from './drizzle/repositories';

// Export Drizzle query utilities
export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
