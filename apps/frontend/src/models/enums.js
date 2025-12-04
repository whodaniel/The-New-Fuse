export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["GUEST"] = "guest";
})(UserRole || (UserRole = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority || (TaskPriority = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["CODE"] = "code";
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["SYSTEM"] = "system";
})(MessageType || (MessageType = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["SUCCESS"] = "success";
    NotificationType["WARNING"] = "warning";
    NotificationType["ERROR"] = "error";
})(NotificationType || (NotificationType = {}));
export var ThemeMode;
(function (ThemeMode) {
    ThemeMode["LIGHT"] = "light";
    ThemeMode["DARK"] = "dark";
    ThemeMode["SYSTEM"] = "system";
})(ThemeMode || (ThemeMode = {}));
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["CONNECTING"] = "connecting";
    ConnectionStatus["ERROR"] = "error";
})(ConnectionStatus || (ConnectionStatus = {}));
export var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["READ"] = "read";
    PermissionLevel["WRITE"] = "write";
    PermissionLevel["ADMIN"] = "admin";
    PermissionLevel["NONE"] = "none";
})(PermissionLevel || (PermissionLevel = {}));
export var AuthProvider;
(function (AuthProvider) {
    AuthProvider["LOCAL"] = "local";
    AuthProvider["GOOGLE"] = "google";
    AuthProvider["GITHUB"] = "github";
    AuthProvider["MICROSOFT"] = "microsoft";
})(AuthProvider || (AuthProvider = {}));
export var FileType;
(function (FileType) {
    FileType["IMAGE"] = "image";
    FileType["DOCUMENT"] = "document";
    FileType["CODE"] = "code";
    FileType["OTHER"] = "other";
})(FileType || (FileType = {}));
export var AgentCapability;
(function (AgentCapability) {
    AgentCapability["CHAT"] = "chat";
    AgentCapability["TASK_EXECUTION"] = "task_execution";
    AgentCapability["FILE_PROCESSING"] = "file_processing";
    AgentCapability["CODE_ANALYSIS"] = "code_analysis";
    AgentCapability["DATA_ANALYSIS"] = "data_analysis";
})(AgentCapability || (AgentCapability = {}));
