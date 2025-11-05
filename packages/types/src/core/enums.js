/**
 * Core enums used throughout the application
 * Centralizes all enum definitions to avoid redundancy
 */
// Task related enums
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["TODO"] = "todo";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["DONE"] = "done";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority || (TaskPriority = {}));
export var TaskType;
(function (TaskType) {
    TaskType["ROUTINE"] = "routine";
    TaskType["ONETIME"] = "onetime";
    TaskType["RECURRING"] = "recurring";
    TaskType["DEPENDENT"] = "dependent";
    TaskType["BACKGROUND"] = "background";
    TaskType["FEATURE"] = "feature";
    TaskType["BUG"] = "bug";
    TaskType["IMPROVEMENT"] = "improvement";
    TaskType["RESEARCH"] = "research";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["ACTION"] = "action";
    TaskType["INTEGRATION"] = "integration";
})(TaskType || (TaskType = {}));
// Workflow related enums
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["STARTED"] = "started";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["STOPPED"] = "stopped";
    WorkflowStatus["ACTIVE"] = "active";
    WorkflowStatus["DRAFT"] = "DRAFT"; // Add missing DRAFT status
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["TASK"] = "task";
    WorkflowStepType["CONDITION"] = "condition";
    WorkflowStepType["LOOP"] = "loop";
    WorkflowStepType["PARALLEL"] = "parallel";
    WorkflowStepType["SEQUENCE"] = "sequence";
    WorkflowStepType["ERROR_HANDLER"] = "error_handler";
    WorkflowStepType["NOTIFICATION"] = "notification";
    WorkflowStepType["CUSTOM"] = "custom";
    WorkflowStepType["TRANSFORM"] = "transform";
    WorkflowStepType["VALIDATE"] = "validate";
    WorkflowStepType["PROCESS"] = "process";
    WorkflowStepType["ANALYSIS"] = "analysis";
    WorkflowStepType["SECURITY"] = "security";
    WorkflowStepType["ACCESSIBILITY"] = "accessibility";
    WorkflowStepType["I18N"] = "i18n";
    WorkflowStepType["DATA_FLOW"] = "data_flow";
    WorkflowStepType["DOCUMENTATION"] = "documentation";
    WorkflowStepType["REPORT"] = "report";
    WorkflowStepType["ANALYZE"] = "analyze";
})(WorkflowStepType || (WorkflowStepType = {}));
// Analysis related enums
export var AnalysisType;
(function (AnalysisType) {
    AnalysisType["DEPENDENCY"] = "dependency";
    AnalysisType["SECURITY"] = "security";
    AnalysisType["PERFORMANCE"] = "performance";
    AnalysisType["CODE_QUALITY"] = "code_quality";
    AnalysisType["CUSTOM"] = "custom";
    AnalysisType["SECURITY_SCAN"] = "security_scan";
})(AnalysisType || (AnalysisType = {}));
export var AnalysisStatus;
(function (AnalysisStatus) {
    AnalysisStatus["IN_PROGRESS"] = "in_progress";
    AnalysisStatus["SUCCESS"] = "success";
    AnalysisStatus["FAILED"] = "failed";
    AnalysisStatus["PENDING"] = "pending";
    AnalysisStatus["RUNNING"] = "running";
    AnalysisStatus["COMPLETED"] = "completed";
})(AnalysisStatus || (AnalysisStatus = {}));
export var Severity;
(function (Severity) {
    Severity["LOW"] = "low";
    Severity["MEDIUM"] = "medium";
    Severity["HIGH"] = "high";
    Severity["CRITICAL"] = "critical";
})(Severity || (Severity = {}));
// Security related enums
export var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "LOW";
    SecuritySeverity["MEDIUM"] = "MEDIUM";
    SecuritySeverity["HIGH"] = "HIGH";
    SecuritySeverity["CRITICAL"] = "CRITICAL";
})(SecuritySeverity || (SecuritySeverity = {}));
export var FeatureStage;
(function (FeatureStage) {
    FeatureStage["PLANNING"] = "PLANNING";
    FeatureStage["DESIGN"] = "DESIGN";
    FeatureStage["DEVELOPMENT"] = "DEVELOPMENT";
    FeatureStage["TESTING"] = "TESTING";
    FeatureStage["DEPLOYMENT"] = "DEPLOYMENT";
    FeatureStage["MONITORING"] = "MONITORING";
    FeatureStage["DEPLOYED"] = "DEPLOYED";
})(FeatureStage || (FeatureStage = {}));
export var StateEventType;
(function (StateEventType) {
    StateEventType["CREATED"] = "state.created";
    StateEventType["UPDATED"] = "state.updated";
    StateEventType["DELETED"] = "state.deleted";
    StateEventType["SNAPSHOT_CREATED"] = "state.snapshot.created";
    StateEventType["TRANSACTION_RECORDED"] = "state.transaction.recorded";
    StateEventType["SYNC_STARTED"] = "state.sync.started";
    StateEventType["SYNC_COMPLETED"] = "state.sync.completed";
})(StateEventType || (StateEventType = {}));
// Communication related enums
export var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "command";
    MessageType["RESPONSE"] = "response";
    MessageType["ERROR"] = "error";
    MessageType["EVENT"] = "event";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["REQUEST"] = "request";
    MessageType["STATUS"] = "status";
    MessageType["LOG"] = "log";
    MessageType["METRIC"] = "metric";
    MessageType["ALERT"] = "alert";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["INFO"] = "info";
    MessageType["WARNING"] = "warning";
    MessageType["TEXT"] = "text";
})(MessageType || (MessageType = {}));
export var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (Priority = {}));
// Error related enums
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
// Feature/Suggestion related enums
export var SuggestionStatus;
(function (SuggestionStatus) {
    // Standard statuses used across all packages
    SuggestionStatus["SUBMITTED"] = "SUBMITTED";
    SuggestionStatus["PENDING"] = "PENDING";
    SuggestionStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    SuggestionStatus["APPROVED"] = "APPROVED";
    SuggestionStatus["ACCEPTED"] = "ACCEPTED";
    SuggestionStatus["REJECTED"] = "REJECTED";
    SuggestionStatus["IMPLEMENTED"] = "IMPLEMENTED";
    SuggestionStatus["CONVERTED"] = "CONVERTED";
    SuggestionStatus["CLOSED"] = "CLOSED";
    // Legacy statuses (kept for backward compatibility)
    SuggestionStatus["NEW"] = "new";
})(SuggestionStatus || (SuggestionStatus = {}));
export var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "LOW";
    SuggestionPriority["MEDIUM"] = "MEDIUM";
    SuggestionPriority["HIGH"] = "HIGH";
    SuggestionPriority["CRITICAL"] = "CRITICAL";
})(SuggestionPriority || (SuggestionPriority = {}));
// Agent related enums
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
    AgentStatus["INITIALIZING"] = "INITIALIZING";
    AgentStatus["READY"] = "READY";
    AgentStatus["TERMINATED"] = "TERMINATED";
    AgentStatus["ARCHIVED"] = "ARCHIVED";
})(AgentStatus || (AgentStatus = {}));
export var AgentType;
(function (AgentType) {
    AgentType["BASIC"] = "BASIC";
    AgentType["CHAT"] = "CHAT";
    AgentType["WORKFLOW"] = "WORKFLOW";
    AgentType["TASK"] = "TASK";
    AgentType["ASSISTANT"] = "ASSISTANT";
    AgentType["ANALYSIS"] = "ANALYSIS";
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
})(AgentType || (AgentType = {}));
export var AgentRole;
(function (AgentRole) {
    AgentRole["ASSISTANT"] = "assistant";
    AgentRole["DEVELOPER"] = "developer";
    AgentRole["REVIEWER"] = "reviewer";
    AgentRole["ARCHITECT"] = "architect";
    AgentRole["TESTER"] = "tester";
    AgentRole["DOCUMENTER"] = "documenter";
})(AgentRole || (AgentRole = {}));
export var AgentCapability;
(function (AgentCapability) {
    // Code-related capabilities
    AgentCapability["CODE_GENERATION"] = "code_generation";
    AgentCapability["CODE_REVIEW"] = "code_review";
    AgentCapability["CODE_REFACTORING"] = "code_refactoring";
    AgentCapability["CODE_EXECUTION"] = "code_execution";
    AgentCapability["DEBUGGING"] = "debugging";
    AgentCapability["TESTING"] = "testing";
    AgentCapability["DOCUMENTATION"] = "documentation";
    // Architecture-related capabilities
    AgentCapability["ARCHITECTURE_DESIGN"] = "architecture_design";
    AgentCapability["OPTIMIZATION"] = "optimization";
    AgentCapability["SECURITY_AUDIT"] = "security_audit";
    // Project-related capabilities
    AgentCapability["PROJECT_MANAGEMENT"] = "project_management";
    // Tool-related capabilities
    AgentCapability["TOOL_USAGE"] = "tool_usage";
    AgentCapability["TASK_EXECUTION"] = "task_execution";
    AgentCapability["FILE_MANAGEMENT"] = "file_management";
    // IDE-related capabilities
    AgentCapability["CODE_COMPLETION"] = "code_completion";
    AgentCapability["CODE_SUGGESTIONS"] = "code_suggestions";
    AgentCapability["SYNTAX_HIGHLIGHTING"] = "syntax_highlighting";
    AgentCapability["ERROR_DETECTION"] = "error_detection";
    AgentCapability["CODE_FORMATTING"] = "code_formatting";
    AgentCapability["INTELLISENSE"] = "intellisense";
    // Communication-related capabilities
    AgentCapability["CHAT"] = "chat";
    AgentCapability["WORKFLOW"] = "workflow";
    AgentCapability["RESEARCH"] = "research";
    AgentCapability["ANALYSIS"] = "analysis";
    AgentCapability["INTEGRATION"] = "integration";
    // Data and automation capabilities
    AgentCapability["DATA_ANALYSIS"] = "data_analysis";
    AgentCapability["AUTOMATION"] = "automation";
    AgentCapability["API_INTEGRATION"] = "api_integration";
})(AgentCapability || (AgentCapability = {}));
export var AgentFramework;
(function (AgentFramework) {
    AgentFramework["VSCODE"] = "vscode";
    AgentFramework["WEBIDE"] = "webide";
    AgentFramework["CLI"] = "cli";
})(AgentFramework || (AgentFramework = {}));
// Notification related enums
export var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["WARNING"] = "warning";
    NotificationType["ERROR"] = "error";
    NotificationType["SUCCESS"] = "success";
    NotificationType["SYSTEM"] = "system";
    NotificationType["USER"] = "user";
    NotificationType["TASK"] = "task";
    NotificationType["WORKFLOW"] = "workflow";
    NotificationType["AGENT"] = "agent";
})(NotificationType || (NotificationType = {}));
export var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["MEDIUM"] = "medium";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["CRITICAL"] = "critical";
})(NotificationPriority || (NotificationPriority = {}));
export var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["UNREAD"] = "unread";
    NotificationStatus["READ"] = "read";
    NotificationStatus["ARCHIVED"] = "archived";
    NotificationStatus["DELETED"] = "deleted";
})(NotificationStatus || (NotificationStatus = {}));
// Duplicate FeatureStage enum removed from line ~222
// Marketplace related enums
export var ListingType;
(function (ListingType) {
    ListingType["SALE"] = "sale";
    ListingType["AUCTION"] = "auction";
    ListingType["LEASE"] = "lease";
})(ListingType || (ListingType = {}));
export var ListingStatus;
(function (ListingStatus) {
    ListingStatus["ACTIVE"] = "active";
    ListingStatus["SOLD"] = "sold";
    ListingStatus["CANCELLED"] = "cancelled";
    ListingStatus["EXPIRED"] = "expired";
})(ListingStatus || (ListingStatus = {}));
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REFUNDED"] = "refunded";
})(TransactionStatus || (TransactionStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["ETH"] = "eth";
    PaymentMethod["SOL"] = "sol";
    PaymentMethod["USDC"] = "usdc";
    PaymentMethod["CUSTOM_TOKEN"] = "custom_token";
})(PaymentMethod || (PaymentMethod = {}));
export var EventType;
(function (EventType) {
    EventType["TASK_CREATED"] = "task_created";
    EventType["TASK_UPDATED"] = "task_updated";
    EventType["TASK_COMPLETED"] = "task_completed";
    EventType["AGENT_STATUS_CHANGED"] = "agent_status_changed";
    EventType["SYSTEM_ERROR"] = "system_error";
})(EventType || (EventType = {}));
//# sourceMappingURL=enums.js.map