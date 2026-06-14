export declare enum AuthMethod {
    PASSWORD = "password",
    OAUTH = "oauth",
    API_KEY = "api_key",
    CERTIFICATE = "certificate"
}
export declare enum AuthRole {
    USER = "user",
    ADMIN = "admin",
    GUEST = "guest",
    SYSTEM = "system"
}
export declare enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    DEBUG = "debug"
}
export interface Token {
    value: string;
    type: 'access' | 'refresh';
    expiresAt: Date;
}
export interface AuthResult {
    success: boolean;
    role: AuthRole;
    token?: Token;
    error?: string;
}
export interface Session {
    id: string;
    userId: string;
    role: AuthRole;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
}
export interface AuditEvent {
    timestamp: Date;
    userId: string;
    action: string;
    details: any;
}
//# sourceMappingURL=types.d.ts.map