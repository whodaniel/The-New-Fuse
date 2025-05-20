/**
 * Security module for MCP communication.
 */
export declare enum SecurityLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum ThreatType {
    INJECTION = "injection",
    XSS = "xss",
    SENSITIVE_DATA = "sensitive_data",
    AUTH_BYPASS = "auth_bypass",
    CODE_EXECUTION = "code_execution"
}
interface SecurityPolicy {
    level: SecurityLevel;
    allowedPatterns: string[];
    blockedPatterns: string[];
    maxMessageSize: number;
    requireEncryption: boolean;
    requireAuthentication: boolean;
    allowedRoles: string[];
}
export declare const STRICT_POLICY: SecurityPolicy;
export declare const MEDIUM_POLICY: SecurityPolicy;
export declare const LOW_POLICY: SecurityPolicy;
/**
 * Enforces security policies on messages.
 */
export declare class SecurityGuard {
    private policy;
    private allowedPatterns;
    private blockedPatterns;
    constructor(policy?: SecurityPolicy);
    const messageStr: unknown;
}
export {};
