/**
 * Drizzle ORM Type Exports
 * Provides inferred types from the Drizzle schema for use across the monorepo
 */
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  agentApiGrants,
  agentApiGrantUsage,
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
  gameAccessRules,
  gameEntitlements,
  julesConfigs,
  julesSessions,
  julesUsageLogs,
  llmConfigs,
  loginAttempts,
  marketplaceListings,
  marketplaceOffers,
  membershipOverrides,
  messages,
  pipelines,
  projects,
  promptSnippets,
  promptTemplates,
  promptVersions,
  providerApiKeys,
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
  workspaceMembers,
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
// MEMBERSHIP OVERRIDES & GAME ENTITLEMENTS
// =============================================================================

export type MembershipOverride = InferSelectModel<typeof membershipOverrides>;
export type NewMembershipOverride = InferInsertModel<typeof membershipOverrides>;

export type GameAccessRule = InferSelectModel<typeof gameAccessRules>;
export type NewGameAccessRule = InferInsertModel<typeof gameAccessRules>;

export type GameEntitlement = InferSelectModel<typeof gameEntitlements>;
export type NewGameEntitlement = InferInsertModel<typeof gameEntitlements>;

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
// JULES INTEGRATION TYPES
// =============================================================================

export type JulesConfig = InferSelectModel<typeof julesConfigs>;
export type NewJulesConfig = InferInsertModel<typeof julesConfigs>;

export type JulesSession = InferSelectModel<typeof julesSessions>;
export type NewJulesSession = InferInsertModel<typeof julesSessions>;

export type JulesUsageLog = InferSelectModel<typeof julesUsageLogs>;
export type NewJulesUsageLog = InferInsertModel<typeof julesUsageLogs>;

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

export type ProviderApiKey = InferSelectModel<typeof providerApiKeys>;
export type NewProviderApiKey = InferInsertModel<typeof providerApiKeys>;
export type AgentApiGrant = InferSelectModel<typeof agentApiGrants>;
export type NewAgentApiGrant = InferInsertModel<typeof agentApiGrants>;
export type AgentApiGrantUsage = InferSelectModel<typeof agentApiGrantUsage>;
export type NewAgentApiGrantUsage = InferInsertModel<typeof agentApiGrantUsage>;

// =============================================================================
// WORKSPACE TYPES
// =============================================================================

export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
export type WorkspaceMember = InferSelectModel<typeof workspaceMembers>;
export type NewWorkspaceMember = InferInsertModel<typeof workspaceMembers>;

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

// =============================================================================
// ENUM TYPE ALIASES
// These provide type-safe string literal types matching the PostgreSQL enums
// =============================================================================

export type UserRole =
  | 'USER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'AGENCY_OWNER'
  | 'AGENCY_ADMIN'
  | 'AGENCY_MANAGER'
  | 'AGENT_OPERATOR';

export type AgentType =
  | 'BASIC'
  | 'CHAT'
  | 'WORKFLOW'
  | 'TASK'
  | 'ASSISTANT'
  | 'ANALYSIS'
  | 'CONVERSATIONAL'
  | 'IDE_EXTENSION'
  | 'API'
  | 'ORCHESTRATOR'
  | 'BROKER'
  | 'MONITOR'
  | 'VALIDATOR'
  | 'ROUTER'
  | 'SCHEDULER'
  | 'GATEWAY'
  | 'CLI_CODER'
  | 'CLI_DEBUGGER'
  | 'CLI_DEVOPS'
  | 'CLI_DATABASE'
  | 'CLI_GIT'
  | 'CLI_SHELL'
  | 'IDE_VSCODE'
  | 'IDE_CURSOR'
  | 'IDE_WINDSURF'
  | 'IDE_JETBRAINS'
  | 'IDE_NEOVIM'
  | 'IDE_EMACS'
  | 'BROWSER_GEMINI'
  | 'BROWSER_CLAUDE'
  | 'BROWSER_CHATGPT'
  | 'BROWSER_COPILOT'
  | 'BROWSER_PERPLEXITY'
  | 'BROWSER_PHIND'
  | 'GITHUB_JULES'
  | 'GITHUB_COPILOT'
  | 'GITHUB_ACTIONS'
  | 'GITHUB_CODESPACES'
  | 'CODE_GENERATOR'
  | 'CODE_REVIEWER'
  | 'CODE_REFACTORER'
  | 'CODE_DOCUMENTER'
  | 'CODE_TESTER'
  | 'CODE_ARCHITECT'
  | 'CODE_OPTIMIZER'
  | 'CODE_SECURITY'
  | 'CODE_MIGRATOR'
  | 'CODE_TRANSLATOR'
  | 'DATA_ANALYST'
  | 'DATA_ENGINEER'
  | 'DATA_SCIENTIST'
  | 'DATA_VISUALIZER'
  | 'DATA_CLEANER'
  | 'DATA_VALIDATOR'
  | 'INFRA_DEVOPS'
  | 'INFRA_CLOUD'
  | 'INFRA_KUBERNETES'
  | 'INFRA_DOCKER'
  | 'INFRA_TERRAFORM'
  | 'INFRA_MONITORING'
  | 'DOC_WRITER'
  | 'DOC_API'
  | 'DOC_README'
  | 'DOC_CHANGELOG'
  | 'DOC_TUTORIAL'
  | 'TEST_UNIT'
  | 'TEST_INTEGRATION'
  | 'TEST_E2E'
  | 'TEST_PERFORMANCE'
  | 'TEST_SECURITY'
  | 'TEST_ACCESSIBILITY'
  | 'AI_TRAINER'
  | 'AI_EVALUATOR'
  | 'AI_PROMPT_ENGINEER'
  | 'AI_RAG'
  | 'AI_EMBEDDINGS'
  | 'AI_FINE_TUNER'
  | 'COMM_TRANSLATOR'
  | 'COMM_SUMMARIZER'
  | 'COMM_WRITER'
  | 'COMM_EMAIL'
  | 'COMM_SLACK'
  | 'COMM_DISCORD'
  | 'RESEARCH_WEB'
  | 'RESEARCH_ACADEMIC'
  | 'RESEARCH_MARKET'
  | 'RESEARCH_COMPETITOR'
  | 'DOMAIN_LEGAL'
  | 'DOMAIN_FINANCE'
  | 'DOMAIN_HEALTHCARE'
  | 'DOMAIN_EDUCATION'
  | 'DOMAIN_ECOMMERCE'
  | 'DOMAIN_GAMING'
  | 'TNF_CORE'
  | 'TNF_ONBOARDING'
  | 'TNF_COORDINATOR'
  | 'TNF_HANDOFF'
  | 'TNF_HEARTBEAT'
  | 'TNF_CLEANUP';

export type AgentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'IDLE'
  | 'BUSY'
  | 'ERROR'
  | 'OFFLINE'
  | 'INITIALIZING'
  | 'READY'
  | 'TERMINATED';

export type WorkflowStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED';

export type WorkflowExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MessageRole = 'USER' | 'AGENT' | 'SYSTEM' | 'ASSISTANT' | 'TOOL';

export type MarketplaceStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export type WalletType = 'SMART_ACCOUNT' | 'EOA' | 'MULTI_SIG';

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
