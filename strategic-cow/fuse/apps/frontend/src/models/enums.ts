export enum UserRole {
    ADMIN = "admin",
    USER = "user",
    GUEST = "guest"
}
export enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    ERROR = "error"
}
export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export enum MessageType {
    TEXT = "text",
    CODE = "code",
    IMAGE = "image",
    FILE = "file",
    SYSTEM = "system"
}
export enum NotificationType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}
export enum ThemeMode {
    LIGHT = "light",
    DARK = "dark",
    SYSTEM = "system"
}
export enum ConnectionStatus {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    ERROR = "error"
}
export enum PermissionLevel {
    READ = "read",
    WRITE = "write",
    ADMIN = "admin",
    NONE = "none"
}
export enum AuthProvider {
    LOCAL = "local",
    GOOGLE = "google",
    GITHUB = "github",
    MICROSOFT = "microsoft"
}
export enum FileType {
    IMAGE = "image",
    DOCUMENT = "document",
    CODE = "code",
    OTHER = "other"
}
export enum AgentCapability {
    CHAT = "chat",
    TASK_EXECUTION = "task_execution",
    FILE_PROCESSING = "file_processing",
    CODE_ANALYSIS = "code_analysis",
    DATA_ANALYSIS = "data_analysis"
}