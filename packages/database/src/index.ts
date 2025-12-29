/**
 * Database Package - Drizzle ORM
 *
 * This package provides database access using Drizzle ORM.
 * Prisma has been completely removed in favor of Drizzle.
 */

// =============================================================================
// DRIZZLE ORM EXPORTS
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

// Export Drizzle schema tables
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
  workspaces,
  tasks,
  workflows,
  workflowExecutions,
} from './drizzle/schema';

// Export Drizzle inferred types
export type {
  Agent,
  Chat,
  ChatMessage,
  Message,
  Task,
  User,
  Workflow,
  WorkflowExecution,
  Workspace,
  NewAgent,
  NewChat,
  NewChatMessage,
  NewMessage,
  NewTask,
  NewUser,
  NewWorkflow,
  NewWorkflowExecution,
  NewWorkspace,
} from './drizzle/types';

// Export Drizzle repositories
export {
  DrizzleAgentRepository,
  DrizzleChatRepository,
  DrizzleTaskRepository,
  DrizzleUserRepository,
  DrizzleWorkflowRepository,
  DrizzleWorkspaceRepository,
  agentNftRepository,
  agentPromptVersionRepository,
  drizzleAgentRepository,
  drizzleChatRepository,
  drizzleTaskRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
  drizzleWorkspaceRepository,
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

// Re-export enums from types for backward compatibility
export {
  AgentStatus,
  AgentType,
  TaskPriority,
  TaskStatus,
  UserRole,
  WorkflowExecutionStatus,
  WorkflowStatus,
} from './drizzle/types';
