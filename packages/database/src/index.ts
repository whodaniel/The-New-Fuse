/**
 * Database Package - Drizzle ORM
 *
 * This package provides database access using Drizzle ORM.
 */

// =============================================================================
// DRIZZLE ORM EXPORTS
// =============================================================================

// Export Drizzle client, module, and schema
export {
  DRIZZLE_CLIENT,
  DrizzleModule as DatabaseModule,
  DrizzleModule, // Alias for backward compatibility
  DrizzleService,
  db,
  queryClient,
  schema,
  type Database,
  type DrizzleClient,
  type DrizzleModuleOptions,
  type Transaction,
} from './drizzle';

// Export DatabaseService
export { DatabaseService } from './drizzle/database.service';

// Export Drizzle schema tables
export * as drizzleSchema from './drizzle/schema';

// Export commonly used schema tables directly for convenience
export {
  agentCapabilityRegistry,
  agentDirectoryEntries,
  agentManagedAccountGrants,
  agentManagedAccounts,
  agentMetrics,
  agentNfts,
  agentOnboardingEvents,
  agentRegistrations,
  agents,
  authSessions,
  chatRoomParticipants,
  chatRooms,
  fractionalShares,
  marketplaceCatalogItems,
  marketplaceListings,
  marketplaceOffers,
  messages,
  notifications,
  providerApiKeys,
  revenueDistributions,
  revenueStreams,
  tasks,
  users,
  workflowExecutions,
  workflows,
  workspaceMembers,
  workspaces,
  workspaceMembers,
} from './drizzle/schema';

// Export Drizzle inferred types
export type {
  Agent,
  AgentManagedAccount,
  AgentManagedAccountGrant,
  Chat,
  ChatMessage,
  Message,
  NewAgent,
  NewAgentManagedAccount,
  NewAgentManagedAccountGrant,
  NewChat,
  NewChatMessage,
  NewMessage,
  NewTask,
  NewTaskExecution,
  NewUser,
  NewWallet,
  NewWorkflow,
  NewWorkflowExecution,
  NewWorkspace,
  NewWorkspaceMember,
  Task,
  TaskExecution,
  User,
  Wallet,
  Workflow,
  WorkflowExecution,
  Workspace,
  WorkspaceMember,
  NewWorkspaceMember,
} from './drizzle/types';

// Export Drizzle repositories
export {
  DrizzleAgentApiGrantRepository,
  DrizzleAgentManagedAccountRepository,
  DrizzleAgentRepository,
  DrizzleAuditLogsRepository,
  DrizzleChatRepository,
  DrizzleMarketplaceCatalogRepository,
  DrizzlePromptTemplateRepository,
  DrizzleProviderApiKeyRepository,
  DrizzleTaskRepository,
  DrizzleUserRepository,
  DrizzleWorkflowRepository,
  DrizzleWorkspaceMemberRepository,
  DrizzleWorkspaceRepository,
  DrizzleWorkspaceMemberRepository,
  agentNftRepository,
  agentPromptVersionRepository,
  drizzleAgentApiGrantRepository,
  drizzleAgentManagedAccountRepository,
  drizzleAgentRepository,
  drizzleApiLogsRepository,
  drizzleAuditLogsRepository,
  drizzleChatRepository,
  drizzleMarketplaceCatalogRepository,
  drizzlePromptTemplateRepository,
  drizzleProviderApiKeyRepository,
  drizzleTaskRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
  drizzleWorkspaceMemberRepository,
  drizzleWorkspaceRepository,
  drizzleWorkspaceMemberRepository,
  fractionalShareRepository,
  optimizationJobRepository,
  revenueDistributionRepository,
  revenueStreamRepository,
  validationDatasetRepository,
  workflowTopologyRepository,
  type AuditLogEntry,
  type AuditLogQuery,
} from './drizzle/repositories';

// Export backwards compatibility repository aliases
export {
  AgentRepository,
  ChatMessageRepository,
  ChatRepository,
  TaskRepository,
  UserRepository,
  WorkflowExecutionRepository,
  WorkflowRepository,
} from './drizzle/compatibility';

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
