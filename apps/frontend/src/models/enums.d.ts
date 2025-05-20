export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    GUEST = "guest"
}
export declare enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    ERROR = "error"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum MessageType {
    TEXT = "text",
    CODE = "code",
    IMAGE = "image",
    FILE = "file",
    SYSTEM = "system"
}
export declare enum NotificationType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}
export declare enum ThemeMode {
    LIGHT = "light",
    DARK = "dark",
    SYSTEM = "system"
}
export declare enum ConnectionStatus {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    ERROR = "error"
}
export declare enum PermissionLevel {
    READ = "read",
    WRITE = "write",
    ADMIN = "admin",
    NONE = "none"
}
export declare enum AuthProvider {
    LOCAL = "local",
    GOOGLE = "google",
    GITHUB = "github",
    MICROSOFT = "microsoft"
}
export declare enum FileType {
    IMAGE = "image",
    DOCUMENT = "document",
    CODE = "code",
    OTHER = "other"
}
export declare enum AgentCapability {
    CHAT = "chat",
    TASK_EXECUTION = "task_execution",
    FILE_PROCESSING = "file_processing",
    CODE_ANALYSIS = "code_analysis",
    DATA_ANALYSIS = "data_analysis"
}
