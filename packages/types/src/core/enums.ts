/**
 * Core enums used throughout the application
 * Centralizes all enum definitions to avoid redundancy
 */

// Task related enums
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TODO = 'todo',
  RUNNING = 'running',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskType {
  ROUTINE = 'routine',
  ONETIME = 'onetime',
  RECURRING = 'recurring',
  DEPENDENT = 'dependent',
  BACKGROUND = 'background',
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  ACTION = 'action',
  INTEGRATION = 'integration'
}

// Workflow related enums
export enum WorkflowStatus {
  PENDING = 'pending',
  STARTED = 'started',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ACTIVE = 'active',
  DRAFT = 'DRAFT' // Add missing DRAFT status
}

export enum WorkflowStepType {
  TASK = 'task',
  CONDITION = 'condition',
  LOOP = 'loop',
  PARALLEL = 'parallel',
  SEQUENCE = 'sequence',
  ERROR_HANDLER = 'error_handler',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom',
  TRANSFORM = 'transform',
  VALIDATE = 'validate',
  PROCESS = 'process',
  ANALYSIS = 'analysis',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility',
  I18N = 'i18n',
  DATA_FLOW = 'data_flow',
  DOCUMENTATION = 'documentation',
  REPORT = 'report',
  ANALYZE = 'analyze'
}

// Analysis related enums
export enum AnalysisType {
  DEPENDENCY = 'dependency',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  CODE_QUALITY = 'code_quality',
  CUSTOM = 'custom',
  SECURITY_SCAN = 'security_scan'
}

export enum AnalysisStatus {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security related enums
export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum FeatureStage {
  PLANNING = 'PLANNING',
  DESIGN = 'DESIGN',
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  DEPLOYMENT = 'DEPLOYMENT',
  MONITORING = 'MONITORING',
  DEPLOYED = 'DEPLOYED'
}

export enum StateEventType {
  CREATED = 'state.created',
  UPDATED = 'state.updated',
  DELETED = 'state.deleted',
  SNAPSHOT_CREATED = 'state.snapshot.created',
  TRANSACTION_RECORDED = 'state.transaction.recorded',
  SYNC_STARTED = 'state.sync.started',
  SYNC_COMPLETED = 'state.sync.completed'
}

// Communication related enums
export enum MessageType {
  COMMAND = 'command',
  RESPONSE = 'response',
  ERROR = 'error',
  EVENT = 'event',
  NOTIFICATION = 'notification',
  REQUEST = 'request',
  STATUS = 'status',
  LOG = 'log',
  METRIC = 'metric',
  ALERT = 'alert',
  HEARTBEAT = 'heartbeat',
  INFO = 'info',
  WARNING = 'warning',
  TEXT = 'text'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error related enums
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Feature/Suggestion related enums
export enum SuggestionStatus {
  // Standard statuses used across all packages
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IMPLEMENTED = 'IMPLEMENTED',
  CONVERTED = 'CONVERTED',
  CLOSED = 'CLOSED',

  // Legacy statuses (kept for backward compatibility)
  NEW = 'new'
}

export enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Agent related enums
export enum AgentStatus {
  // Core statuses
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted',

  // Operational statuses
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',

  // Extended statuses
  INITIALIZING = 'initializing',
  READY = 'ready',
  TERMINATED = 'terminated',
  LEARNING = 'learning'
}

export enum AgentType {
  HUMAN = 'human',
  AI = 'ai',
  CONVERSATIONAL = 'conversational',
  IDE_EXTENSION = 'ide_extension',
  API = 'api'
}

export enum AgentRole {
  ASSISTANT = 'assistant',
  DEVELOPER = 'developer',
  REVIEWER = 'reviewer',
  ARCHITECT = 'architect',
  TESTER = 'tester',
  DOCUMENTER = 'documenter'
}

export enum AgentCapability {
  // Code-related capabilities
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  CODE_REFACTORING = 'code_refactoring',
  CODE_EXECUTION = 'code_execution',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',

  // Architecture-related capabilities
  ARCHITECTURE_DESIGN = 'architecture_design',
  OPTIMIZATION = 'optimization',
  SECURITY_AUDIT = 'security_audit',

  // Project-related capabilities
  PROJECT_MANAGEMENT = 'project_management',

  // Tool-related capabilities
  TOOL_USAGE = 'tool_usage',
  TASK_EXECUTION = 'task_execution',
  FILE_MANAGEMENT = 'file_management',

  // IDE-related capabilities
  CODE_COMPLETION = 'code_completion',
  CODE_SUGGESTIONS = 'code_suggestions',
  SYNTAX_HIGHLIGHTING = 'syntax_highlighting',
  ERROR_DETECTION = 'error_detection',
  CODE_FORMATTING = 'code_formatting',
  INTELLISENSE = 'intellisense',

  // Communication-related capabilities
  CHAT = 'chat',
  WORKFLOW = 'workflow',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  INTEGRATION = 'integration'
}

export enum AgentFramework {
  VSCODE = 'vscode',
  WEBIDE = 'webide',
  CLI = 'cli'
}

// Notification related enums
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
  USER = 'user',
  TASK = 'task',
  WORKFLOW = 'workflow',
  AGENT = 'agent'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Duplicate FeatureStage enum removed from line ~222
// Marketplace related enums
export enum ListingType {
  SALE = 'sale',
  AUCTION = 'auction',
  LEASE = 'lease'
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  ETH = 'eth',
  SOL = 'sol',
  USDC = 'usdc',
  CUSTOM_TOKEN = 'custom_token'
}

export enum EventType {
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  AGENT_STATUS_CHANGED = 'agent_status_changed',
  SYSTEM_ERROR = 'system_error'
}
