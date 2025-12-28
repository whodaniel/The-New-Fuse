/**
 * Drizzle ORM Enum Definitions
 * Direct mapping from Prisma schema enums
 */
import { pgEnum } from 'drizzle-orm/pg-core';

// =============================================================================
// USER MANAGEMENT ENUMS
// =============================================================================

export const userRoleEnum = pgEnum('UserRole', [
  'USER',
  'ADMIN',
  'SUPER_ADMIN',
  'AGENCY_OWNER',
  'AGENCY_ADMIN',
  'AGENCY_MANAGER',
  'AGENT_OPERATOR',
]);

// =============================================================================
// AGENT SYSTEM ENUMS
// =============================================================================

export const agentTypeEnum = pgEnum('AgentType', [
  // Core types
  'BASIC',
  'CHAT',
  'WORKFLOW',
  'TASK',
  'ASSISTANT',
  'ANALYSIS',
  'CONVERSATIONAL',
  'IDE_EXTENSION',
  'API',
  // System/Orchestration
  'ORCHESTRATOR',
  'BROKER',
  'MONITOR',
  'VALIDATOR',
  'ROUTER',
  'SCHEDULER',
  'GATEWAY',
  // CLI Agents
  'CLI_CODER',
  'CLI_DEBUGGER',
  'CLI_DEVOPS',
  'CLI_DATABASE',
  'CLI_GIT',
  'CLI_SHELL',
  // IDE Extension Agents
  'IDE_VSCODE',
  'IDE_CURSOR',
  'IDE_WINDSURF',
  'IDE_JETBRAINS',
  'IDE_NEOVIM',
  'IDE_EMACS',
  // Browser Agents
  'BROWSER_GEMINI',
  'BROWSER_CLAUDE',
  'BROWSER_CHATGPT',
  'BROWSER_COPILOT',
  'BROWSER_PERPLEXITY',
  'BROWSER_PHIND',
  // GitHub Integrated
  'GITHUB_JULES',
  'GITHUB_COPILOT',
  'GITHUB_ACTIONS',
  'GITHUB_CODESPACES',
  // Code/Development Agents
  'CODE_GENERATOR',
  'CODE_REVIEWER',
  'CODE_REFACTORER',
  'CODE_DOCUMENTER',
  'CODE_TESTER',
  'CODE_ARCHITECT',
  'CODE_OPTIMIZER',
  'CODE_SECURITY',
  'CODE_MIGRATOR',
  'CODE_TRANSLATOR',
  // Data Agents
  'DATA_ANALYST',
  'DATA_ENGINEER',
  'DATA_SCIENTIST',
  'DATA_VISUALIZER',
  'DATA_CLEANER',
  'DATA_VALIDATOR',
  // Infrastructure Agents
  'INFRA_DEVOPS',
  'INFRA_CLOUD',
  'INFRA_KUBERNETES',
  'INFRA_DOCKER',
  'INFRA_TERRAFORM',
  'INFRA_MONITORING',
  // Documentation Agents
  'DOC_WRITER',
  'DOC_API',
  'DOC_README',
  'DOC_CHANGELOG',
  'DOC_TUTORIAL',
  // Testing Agents
  'TEST_UNIT',
  'TEST_INTEGRATION',
  'TEST_E2E',
  'TEST_PERFORMANCE',
  'TEST_SECURITY',
  'TEST_ACCESSIBILITY',
  // AI/ML Agents
  'AI_TRAINER',
  'AI_EVALUATOR',
  'AI_PROMPT_ENGINEER',
  'AI_RAG',
  'AI_EMBEDDINGS',
  'AI_FINE_TUNER',
  // Communication Agents
  'COMM_TRANSLATOR',
  'COMM_SUMMARIZER',
  'COMM_WRITER',
  'COMM_EMAIL',
  'COMM_SLACK',
  'COMM_DISCORD',
  // Research Agents
  'RESEARCH_WEB',
  'RESEARCH_ACADEMIC',
  'RESEARCH_MARKET',
  'RESEARCH_COMPETITOR',
  // Domain Agents
  'DOMAIN_LEGAL',
  'DOMAIN_FINANCE',
  'DOMAIN_HEALTHCARE',
  'DOMAIN_EDUCATION',
  'DOMAIN_ECOMMERCE',
  'DOMAIN_GAMING',
  // TNF Framework Agents
  'TNF_CORE',
  'TNF_ONBOARDING',
  'TNF_COORDINATOR',
  'TNF_HANDOFF',
  'TNF_HEARTBEAT',
  'TNF_CLEANUP',
]);

export const agentStatusEnum = pgEnum('AgentStatus', [
  'ACTIVE',
  'INACTIVE',
  'IDLE',
  'BUSY',
  'ERROR',
  'OFFLINE',
  'INITIALIZING',
  'READY',
  'TERMINATED',
]);

export const agentCapabilityEnum = pgEnum('AgentCapability', [
  'CODE_GENERATION',
  'CODE_REVIEW',
  'CODE_REFACTORING',
  'CODE_EXECUTION',
  'DEBUGGING',
  'TESTING',
  'DOCUMENTATION',
  'ARCHITECTURE_DESIGN',
  'OPTIMIZATION',
  'SECURITY_AUDIT',
  'PROJECT_MANAGEMENT',
  'TOOL_USAGE',
  'TASK_EXECUTION',
  'FILE_MANAGEMENT',
  'CODE_COMPLETION',
  'CODE_SUGGESTIONS',
  'SYNTAX_HIGHLIGHTING',
  'ERROR_DETECTION',
  'CODE_FORMATTING',
  'INTELLISENSE',
  'CHAT',
  'WORKFLOW',
  'RESEARCH',
  'ANALYSIS',
  'INTEGRATION',
]);

// =============================================================================
// MESSAGE SYSTEM ENUMS
// =============================================================================

export const messageRoleEnum = pgEnum('MessageRole', [
  'USER',
  'AGENT',
  'SYSTEM',
  'ASSISTANT',
  'TOOL',
]);

// =============================================================================
// WORKFLOW SYSTEM ENUMS
// =============================================================================

export const workflowStatusEnum = pgEnum('WorkflowStatus', [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'FAILED',
]);

export const workflowExecutionStatusEnum = pgEnum('WorkflowExecutionStatus', [
  'PENDING',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const pipelineStatusEnum = pgEnum('PipelineStatus', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'FAILED',
]);

// =============================================================================
// TASK SYSTEM ENUMS
// =============================================================================

export const taskStatusEnum = pgEnum('TaskStatus', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const taskPriorityEnum = pgEnum('TaskPriority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// =============================================================================
// CODE EXECUTION ENUMS
// =============================================================================

export const codeExecutionLanguageEnum = pgEnum('CodeExecutionLanguage', [
  'JAVASCRIPT',
  'TYPESCRIPT',
  'PYTHON',
  'RUBY',
  'SHELL',
  'HTML',
  'CSS',
]);

export const codeExecutionTierEnum = pgEnum('CodeExecutionTier', [
  'BASIC',
  'STANDARD',
  'PREMIUM',
  'ENTERPRISE',
]);

export const codeExecutionStatusEnum = pgEnum('CodeExecutionStatus', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'TIMEOUT',
  'CANCELLED',
]);

// =============================================================================
// MARKETPLACE ENUMS
// =============================================================================

export const marketplaceStatusEnum = pgEnum('MarketplaceStatus', [
  'ACTIVE',
  'SOLD',
  'CANCELLED',
  'EXPIRED',
]);

export const offerStatusEnum = pgEnum('OfferStatus', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
]);

// =============================================================================
// WALLET ENUMS
// =============================================================================

export const walletTypeEnum = pgEnum('WalletType', ['SMART_ACCOUNT', 'EOA', 'MULTI_SIG']);

export const transactionStatusEnum = pgEnum('TransactionStatus', [
  'PENDING',
  'CONFIRMED',
  'FAILED',
  'CANCELLED',
]);

export const transactionTypeEnum = pgEnum('TransactionType', [
  'TRANSFER',
  'CONTRACT_CALL',
  'CONTRACT_DEPLOYMENT',
  'NFT_MINT',
  'NFT_TRANSFER',
]);

// =============================================================================
// ENTITY REGISTRY ENUMS
// =============================================================================

export const registeredEntityTypeEnum = pgEnum('RegisteredEntityType', [
  'AGENT',
  'WORKFLOW',
  'TOOL',
  'SERVICE',
  'INTEGRATION',
  'TEMPLATE',
  'COMPONENT',
  'MODULE',
]);

export const entityStatusEnum = pgEnum('EntityStatus', [
  'ACTIVE',
  'INACTIVE',
  'DEPRECATED',
  'PENDING',
  'FAILED',
]);
