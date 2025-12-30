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

// Export DatabaseService and PrismaService (backwards compatibility)
export { DatabaseService, PrismaService } from './drizzle/database.service';

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
  tasks,
  users,
  workflowExecutions,
  workflows,
  workspaces,
} from './drizzle/schema';

// Export Drizzle inferred types
export type {
  Agent,
  Chat,
  ChatMessage,
  Message,
  NewAgent,
  NewChat,
  NewChatMessage,
  NewMessage,
  NewTask,
  NewUser,
  NewWorkflow,
  NewWorkflowExecution,
  NewWorkspace,
  Task,
  User,
  Workflow,
  WorkflowExecution,
  Workspace,
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

// Re-export pg enums from schema for backward compatibility
// Note: These are pgEnum types, not TypeScript enums
export {
  agentStatusEnum,
  agentTypeEnum,
  taskPriorityEnum,
  taskStatusEnum,
  userRoleEnum,
  workflowExecutionStatusEnum,
  workflowStatusEnum,
} from './drizzle/schema';

// Re-export TypeScript enum type aliases for type annotations
export type {
  AgentStatus,
  AgentType,
  MarketplaceStatus,
  MessageRole,
  OfferStatus,
  TaskPriority,
  TaskStatus,
  TransactionStatus,
  UserRole,
  WalletType,
  WorkflowExecutionStatus,
  WorkflowStatus,
} from './drizzle/types';
