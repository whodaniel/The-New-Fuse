/**
 * Drizzle ORM Type Exports
 * Provides inferred types from the Drizzle schema for use across the monorepo
 */
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  agentCapabilityRegistry,
  agentDirectoryEntries,
  agentMemories,
  agentMetadata,
  agentMetrics,
  agentNfts,
  agentOnboardingEvents,
  agentPromptVersions,
  agentRegistrations,
  agents,
  authEvents,
  authSessions,
  businessMetrics,
  chatMessages,
  chatRoomParticipants,
  chatRooms,
  chats,
  codeExecutionSessions,
  codeExecutionUsage,
  errorLogs,
  fractionalShares,
  llmConfigs,
  loginAttempts,
  marketplaceListings,
  marketplaceOffers,
  messages,
  pipelines,
  projects,
  promptSnippets,
  promptTemplates,
  promptVersions,
  readReceipts,
  registeredEntities,
  resourceAllocations,
  revenueDistributions,
  revenueStreams,
  syncConflicts,
  syncStates,
  taskExecutions,
  tasks,
  transactions,
  users,
  validationDatasets,
  wallets,
  workflowExecutions,
  workflows,
  workflowSteps,
  workflowTemplates,
  workspaces,
} from './schema';

// =============================================================================
// USER TYPES
// =============================================================================

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type AuthSession = InferSelectModel<typeof authSessions>;
export type NewAuthSession = InferInsertModel<typeof authSessions>;

export type LoginAttempt = InferSelectModel<typeof loginAttempts>;
export type NewLoginAttempt = InferInsertModel<typeof loginAttempts>;

export type AuthEvent = InferSelectModel<typeof authEvents>;
export type NewAuthEvent = InferInsertModel<typeof authEvents>;

// =============================================================================
// AGENT TYPES
// =============================================================================

export type Agent = InferSelectModel<typeof agents>;
export type NewAgent = InferInsertModel<typeof agents>;

export type AgentMetadata = InferSelectModel<typeof agentMetadata>;
export type NewAgentMetadata = InferInsertModel<typeof agentMetadata>;

export type AgentNft = InferSelectModel<typeof agentNfts>;
export type NewAgentNft = InferInsertModel<typeof agentNfts>;

export type AgentRegistration = InferSelectModel<typeof agentRegistrations>;
export type NewAgentRegistration = InferInsertModel<typeof agentRegistrations>;

export type AgentCapabilityRegistryEntry = InferSelectModel<typeof agentCapabilityRegistry>;
export type NewAgentCapabilityRegistryEntry = InferInsertModel<typeof agentCapabilityRegistry>;

export type AgentOnboardingEvent = InferSelectModel<typeof agentOnboardingEvents>;
export type NewAgentOnboardingEvent = InferInsertModel<typeof agentOnboardingEvents>;

export type AgentDirectoryEntry = InferSelectModel<typeof agentDirectoryEntries>;
export type NewAgentDirectoryEntry = InferInsertModel<typeof agentDirectoryEntries>;

export type AgentPromptVersion = InferSelectModel<typeof agentPromptVersions>;
export type NewAgentPromptVersion = InferInsertModel<typeof agentPromptVersions>;

export type AgentMetric = InferSelectModel<typeof agentMetrics>;
export type NewAgentMetric = InferInsertModel<typeof agentMetrics>;

// =============================================================================
// CHAT TYPES
// =============================================================================

export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

export type ChatRoom = InferSelectModel<typeof chatRooms>;
export type NewChatRoom = InferInsertModel<typeof chatRooms>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type NewChatMessage = InferInsertModel<typeof chatMessages>;

export type ChatRoomParticipant = InferSelectModel<typeof chatRoomParticipants>;
export type NewChatRoomParticipant = InferInsertModel<typeof chatRoomParticipants>;

export type ReadReceipt = InferSelectModel<typeof readReceipts>;
export type NewReadReceipt = InferInsertModel<typeof readReceipts>;

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export type Workflow = InferSelectModel<typeof workflows>;
export type NewWorkflow = InferInsertModel<typeof workflows>;

export type WorkflowStep = InferSelectModel<typeof workflowSteps>;
export type NewWorkflowStep = InferInsertModel<typeof workflowSteps>;

export type WorkflowExecution = InferSelectModel<typeof workflowExecutions>;
export type NewWorkflowExecution = InferInsertModel<typeof workflowExecutions>;

export type WorkflowTemplate = InferSelectModel<typeof workflowTemplates>;
export type NewWorkflowTemplate = InferInsertModel<typeof workflowTemplates>;

// =============================================================================
// PIPELINE & TASK TYPES
// =============================================================================

export type Pipeline = InferSelectModel<typeof pipelines>;
export type NewPipeline = InferInsertModel<typeof pipelines>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

export type TaskExecution = InferSelectModel<typeof taskExecutions>;
export type NewTaskExecution = InferInsertModel<typeof taskExecutions>;

// =============================================================================
// CODE EXECUTION TYPES
// =============================================================================

export type CodeExecutionUsage = InferSelectModel<typeof codeExecutionUsage>;
export type NewCodeExecutionUsage = InferInsertModel<typeof codeExecutionUsage>;

export type CodeExecutionSession = InferSelectModel<typeof codeExecutionSessions>;
export type NewCodeExecutionSession = InferInsertModel<typeof codeExecutionSessions>;

// =============================================================================
// MARKETPLACE TYPES
// =============================================================================

export type FractionalShare = InferSelectModel<typeof fractionalShares>;
export type NewFractionalShare = InferInsertModel<typeof fractionalShares>;

export type RevenueStream = InferSelectModel<typeof revenueStreams>;
export type NewRevenueStream = InferInsertModel<typeof revenueStreams>;

export type RevenueDistribution = InferSelectModel<typeof revenueDistributions>;
export type NewRevenueDistribution = InferInsertModel<typeof revenueDistributions>;

export type MarketplaceListing = InferSelectModel<typeof marketplaceListings>;
export type NewMarketplaceListing = InferInsertModel<typeof marketplaceListings>;

export type MarketplaceOffer = InferSelectModel<typeof marketplaceOffers>;
export type NewMarketplaceOffer = InferInsertModel<typeof marketplaceOffers>;

// =============================================================================
// WALLET TYPES
// =============================================================================

export type Wallet = InferSelectModel<typeof wallets>;
export type NewWallet = InferInsertModel<typeof wallets>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

// =============================================================================
// SYSTEM TYPES
// =============================================================================

export type RegisteredEntity = InferSelectModel<typeof registeredEntities>;
export type NewRegisteredEntity = InferInsertModel<typeof registeredEntities>;

export type LLMConfig = InferSelectModel<typeof llmConfigs>;
export type NewLLMConfig = InferInsertModel<typeof llmConfigs>;

export type PromptTemplate = InferSelectModel<typeof promptTemplates>;
export type NewPromptTemplate = InferInsertModel<typeof promptTemplates>;

export type PromptVersion = InferSelectModel<typeof promptVersions>;
export type NewPromptVersion = InferInsertModel<typeof promptVersions>;

export type PromptSnippet = InferSelectModel<typeof promptSnippets>;
export type NewPromptSnippet = InferInsertModel<typeof promptSnippets>;

export type ValidationDataset = InferSelectModel<typeof validationDatasets>;
export type NewValidationDataset = InferInsertModel<typeof validationDatasets>;

export type BusinessMetric = InferSelectModel<typeof businessMetrics>;
export type NewBusinessMetric = InferInsertModel<typeof businessMetrics>;

export type ErrorLog = InferSelectModel<typeof errorLogs>;
export type NewErrorLog = InferInsertModel<typeof errorLogs>;

// =============================================================================
// WORKSPACE TYPES
// =============================================================================

export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type AgentMemory = InferSelectModel<typeof agentMemories>;
export type NewAgentMemory = InferInsertModel<typeof agentMemories>;

export type ResourceAllocation = InferSelectModel<typeof resourceAllocations>;
export type NewResourceAllocation = InferInsertModel<typeof resourceAllocations>;

export type SyncState = InferSelectModel<typeof syncStates>;
export type NewSyncState = InferInsertModel<typeof syncStates>;

export type SyncConflict = InferSelectModel<typeof syncConflicts>;
export type NewSyncConflict = InferInsertModel<typeof syncConflicts>;
