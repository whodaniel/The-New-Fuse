"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityStatusEnum = exports.registeredEntityTypeEnum = exports.transactionTypeEnum = exports.transactionStatusEnum = exports.walletTypeEnum = exports.offerStatusEnum = exports.marketplaceStatusEnum = exports.codeExecutionStatusEnum = exports.codeExecutionTierEnum = exports.codeExecutionLanguageEnum = exports.taskPriorityEnum = exports.taskStatusEnum = exports.pipelineStatusEnum = exports.workflowExecutionStatusEnum = exports.workflowStatusEnum = exports.messageRoleEnum = exports.agentCapabilityEnum = exports.agentStatusEnum = exports.agentTypeEnum = exports.userRoleEnum = void 0;
/**
 * Drizzle ORM Enum Definitions
 * Direct mapping from Drizzle schema enums
 */
const pg_core_1 = require("drizzle-orm/pg-core");
// =============================================================================
// USER MANAGEMENT ENUMS
// =============================================================================
exports.userRoleEnum = (0, pg_core_1.pgEnum)('UserRole', [
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
exports.agentTypeEnum = (0, pg_core_1.pgEnum)('AgentType', [
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
exports.agentStatusEnum = (0, pg_core_1.pgEnum)('AgentStatus', [
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
exports.agentCapabilityEnum = (0, pg_core_1.pgEnum)('AgentCapability', [
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
exports.messageRoleEnum = (0, pg_core_1.pgEnum)('MessageRole', [
    'USER',
    'AGENT',
    'SYSTEM',
    'ASSISTANT',
    'TOOL',
]);
// =============================================================================
// WORKFLOW SYSTEM ENUMS
// =============================================================================
exports.workflowStatusEnum = (0, pg_core_1.pgEnum)('WorkflowStatus', [
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'FAILED',
]);
exports.workflowExecutionStatusEnum = (0, pg_core_1.pgEnum)('WorkflowExecutionStatus', [
    'PENDING',
    'RUNNING',
    'PAUSED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]);
exports.pipelineStatusEnum = (0, pg_core_1.pgEnum)('PipelineStatus', [
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'FAILED',
]);
// =============================================================================
// TASK SYSTEM ENUMS
// =============================================================================
exports.taskStatusEnum = (0, pg_core_1.pgEnum)('TaskStatus', [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]);
exports.taskPriorityEnum = (0, pg_core_1.pgEnum)('TaskPriority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
// =============================================================================
// CODE EXECUTION ENUMS
// =============================================================================
exports.codeExecutionLanguageEnum = (0, pg_core_1.pgEnum)('CodeExecutionLanguage', [
    'JAVASCRIPT',
    'TYPESCRIPT',
    'PYTHON',
    'RUBY',
    'SHELL',
    'HTML',
    'CSS',
]);
exports.codeExecutionTierEnum = (0, pg_core_1.pgEnum)('CodeExecutionTier', [
    'BASIC',
    'STANDARD',
    'PREMIUM',
    'ENTERPRISE',
]);
exports.codeExecutionStatusEnum = (0, pg_core_1.pgEnum)('CodeExecutionStatus', [
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
exports.marketplaceStatusEnum = (0, pg_core_1.pgEnum)('MarketplaceStatus', [
    'ACTIVE',
    'SOLD',
    'CANCELLED',
    'EXPIRED',
]);
exports.offerStatusEnum = (0, pg_core_1.pgEnum)('OfferStatus', [
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED',
]);
// =============================================================================
// WALLET ENUMS
// =============================================================================
exports.walletTypeEnum = (0, pg_core_1.pgEnum)('WalletType', ['SMART_ACCOUNT', 'EOA', 'MULTI_SIG']);
exports.transactionStatusEnum = (0, pg_core_1.pgEnum)('TransactionStatus', [
    'PENDING',
    'CONFIRMED',
    'FAILED',
    'CANCELLED',
]);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)('TransactionType', [
    'TRANSFER',
    'CONTRACT_CALL',
    'CONTRACT_DEPLOYMENT',
    'NFT_MINT',
    'NFT_TRANSFER',
]);
// =============================================================================
// ENTITY REGISTRY ENUMS
// =============================================================================
exports.registeredEntityTypeEnum = (0, pg_core_1.pgEnum)('RegisteredEntityType', [
    'AGENT',
    'WORKFLOW',
    'TOOL',
    'SERVICE',
    'INTEGRATION',
    'TEMPLATE',
    'COMPONENT',
    'MODULE',
]);
exports.entityStatusEnum = (0, pg_core_1.pgEnum)('EntityStatus', [
    'ACTIVE',
    'INACTIVE',
    'DEPRECATED',
    'PENDING',
    'FAILED',
]);
//# sourceMappingURL=enums.js.map