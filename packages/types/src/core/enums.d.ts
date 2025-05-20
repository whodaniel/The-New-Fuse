/**
 * Core enums used throughout the application
 * Centralizes all enum definitions to avoid redundancy
 */
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TODO = "todo",
    RUNNING = "running",
    DONE = "done"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum TaskType {
    ROUTINE = "routine",
    ONETIME = "onetime",
    RECURRING = "recurring",
    DEPENDENT = "dependent",
    BACKGROUND = "background",
    FEATURE = "feature",
    BUG = "bug",
    IMPROVEMENT = "improvement",
    RESEARCH = "research",
    ANALYSIS = "analysis",
    ACTION = "action",
    INTEGRATION = "integration"
}
export declare enum WorkflowStatus {
    PENDING = "pending",
    STARTED = "started",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    PAUSED = "paused",
    STOPPED = "stopped",
    ACTIVE = "active",
    DRAFT = "DRAFT"
}
export declare enum WorkflowStepType {
    TASK = "task",
    CONDITION = "condition",
    LOOP = "loop",
    PARALLEL = "parallel",
    SEQUENCE = "sequence",
    ERROR_HANDLER = "error_handler",
    NOTIFICATION = "notification",
    CUSTOM = "custom",
    TRANSFORM = "transform",
    VALIDATE = "validate",
    PROCESS = "process",
    ANALYSIS = "analysis",
    SECURITY = "security",
    ACCESSIBILITY = "accessibility",
    I18N = "i18n",
    DATA_FLOW = "data_flow",
    DOCUMENTATION = "documentation",
    REPORT = "report",
    ANALYZE = "analyze"
}
export declare enum AnalysisType {
    DEPENDENCY = "dependency",
    SECURITY = "security",
    PERFORMANCE = "performance",
    CODE_QUALITY = "code_quality",
    CUSTOM = "custom",
    SECURITY_SCAN = "security_scan"
}
export declare enum AnalysisStatus {
    IN_PROGRESS = "in_progress",
    SUCCESS = "success",
    FAILED = "failed",
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed"
}
export declare enum Severity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum SecuritySeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum FeatureStage {
    PLANNING = "PLANNING",
    DESIGN = "DESIGN",
    DEVELOPMENT = "DEVELOPMENT",
    TESTING = "TESTING",
    DEPLOYMENT = "DEPLOYMENT",
    MONITORING = "MONITORING",
    DEPLOYED = "DEPLOYED"
}
export declare enum StateEventType {
    CREATED = "state.created",
    UPDATED = "state.updated",
    DELETED = "state.deleted",
    SNAPSHOT_CREATED = "state.snapshot.created",
    TRANSACTION_RECORDED = "state.transaction.recorded",
    SYNC_STARTED = "state.sync.started",
    SYNC_COMPLETED = "state.sync.completed"
}
export declare enum MessageType {
    COMMAND = "command",
    RESPONSE = "response",
    ERROR = "error",
    EVENT = "event",
    NOTIFICATION = "notification",
    REQUEST = "request",
    STATUS = "status",
    LOG = "log",
    METRIC = "metric",
    ALERT = "alert",
    HEARTBEAT = "heartbeat",
    INFO = "info",
    WARNING = "warning",
    TEXT = "text"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum SuggestionStatus {
    SUBMITTED = "SUBMITTED",
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    IMPLEMENTED = "IMPLEMENTED",
    CONVERTED = "CONVERTED",
    CLOSED = "CLOSED",
    NEW = "new"
}
export declare enum SuggestionPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    DELETED = "deleted",
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    ERROR = "error",
    INITIALIZING = "initializing",
    READY = "ready",
    TERMINATED = "terminated",
    LEARNING = "learning"
}
export declare enum AgentType {
    HUMAN = "human",
    AI = "ai",
    CONVERSATIONAL = "conversational",
    IDE_EXTENSION = "ide_extension",
    API = "api"
}
export declare enum AgentRole {
    ASSISTANT = "assistant",
    DEVELOPER = "developer",
    REVIEWER = "reviewer",
    ARCHITECT = "architect",
    TESTER = "tester",
    DOCUMENTER = "documenter"
}
export declare enum AgentCapability {
    CODE_GENERATION = "code_generation",
    CODE_REVIEW = "code_review",
    CODE_REFACTORING = "code_refactoring",
    DEBUGGING = "debugging",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    ARCHITECTURE_DESIGN = "architecture_design",
    OPTIMIZATION = "optimization",
    SECURITY_AUDIT = "security_audit",
    PROJECT_MANAGEMENT = "project_management",
    TOOL_USAGE = "tool_usage",
    TASK_EXECUTION = "task_execution",
    FILE_MANAGEMENT = "file_management",
    CODE_COMPLETION = "code_completion",
    CODE_SUGGESTIONS = "code_suggestions",
    SYNTAX_HIGHLIGHTING = "syntax_highlighting",
    ERROR_DETECTION = "error_detection",
    CODE_FORMATTING = "code_formatting",
    INTELLISENSE = "intellisense",
    CHAT = "chat",
    WORKFLOW = "workflow",
    RESEARCH = "research",
    ANALYSIS = "analysis",
    INTEGRATION = "integration"
}
export declare enum AgentFramework {
    VSCODE = "vscode",
    WEBIDE = "webide",
    CLI = "cli"
}
export declare enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success",
    SYSTEM = "system",
    USER = "user",
    TASK = "task",
    WORKFLOW = "workflow",
    AGENT = "agent"
}
export declare enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum NotificationStatus {
    UNREAD = "unread",
    READ = "read",
    ARCHIVED = "archived",
    DELETED = "deleted"
}
export declare enum ListingType {
    SALE = "sale",
    AUCTION = "auction",
    LEASE = "lease"
}
export declare enum ListingStatus {
    ACTIVE = "active",
    SOLD = "sold",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentMethod {
    ETH = "eth",
    SOL = "sol",
    USDC = "usdc",
    CUSTOM_TOKEN = "custom_token"
}
export declare enum EventType {
    TASK_CREATED = "task_created",
    TASK_UPDATED = "task_updated",
    TASK_COMPLETED = "task_completed",
    AGENT_STATUS_CHANGED = "agent_status_changed",
    SYSTEM_ERROR = "system_error"
}
