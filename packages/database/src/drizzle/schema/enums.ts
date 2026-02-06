/**
 * Drizzle ORM Enum Definitions
 * Direct mapping from legacy schema enums
 */
import { pgEnum } from 'drizzle-orm/pg-core';

// =============================================================================
// USER MANAGEMENT ENUMS
// =============================================================================

export const userRoleEnum = pgEnum('UserRole', ['USER', 'ADMIN', 'AGENT']);

export const agentTypeEnum = pgEnum('AgentType', [
  'GENERIC',
  'CODER',
  'ANALYZER',
  'COORDINATOR',
  'COMMUNICATOR',
  'CODE_REVIEWER',
  'CODE_TESTER',
  'CODE_SECURITY',
]);

export const agentStatusEnum = pgEnum('AgentStatus', ['IDLE', 'BUSY', 'ERROR', 'OFFLINE', 'ACTIVE']);

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
