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
  DrizzleModule,
  DrizzleService,
  db,
  queryClient,
  schema,
  type Database,
  type DrizzleClient,
  type DrizzleModuleOptions,
  type Transaction,
} from './drizzle.js';

export { DatabaseService } from './drizzle/database.service.js';

export * as drizzleSchema from './drizzle/schema.js';

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
} from './drizzle/schema.js';

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
} from './drizzle/types.js';

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
  fractionalShareRepository,
  optimizationJobRepository,
  revenueDistributionRepository,
  revenueStreamRepository,
  validationDatasetRepository,
  workflowTopologyRepository,
  type AuditLogEntry,
  type AuditLogQuery,
} from './drizzle/repositories.js';

export {
  AgentRepository,
  ChatMessageRepository,
  ChatRepository,
  TaskRepository,
  UserRepository,
  WorkflowExecutionRepository,
  WorkflowRepository,
} from './drizzle/compatibility.js';

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

export {
  agentStatusEnum,
  agentTypeEnum,
  taskPriorityEnum,
  taskStatusEnum,
  userRoleEnum,
  workflowExecutionStatusEnum,
  workflowStatusEnum,
} from './drizzle/schema.js';

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
} from './drizzle/types.js';
