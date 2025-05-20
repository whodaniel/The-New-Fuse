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
export interface SecurityCheckResult {
    passed: boolean;
    threats: ThreatType[];
    details: {
        size?: {
            current: number;
            max: number;
        };
        blockedPattern?: {
            pattern: string;
            matches: string[];
        };
        allowedPattern?: {
            required: string[];
            found: string[];
        };
        sensitiveData?: {
            type: string;
            location: string;
        };
        authentication?: {
            required: boolean;
            provided: boolean;
        };
        encryption?: {
            required: boolean;
            provided: boolean;
        };
        authorization?: {
            role: string;
            allowed: string[];
        };
    };
}
export interface SecurityPolicy {
    maxMessageSize: number;
    allowedPatterns: string[];
    blockedPatterns: string[];
    requireAuthentication: boolean;
    requireEncryption: boolean;
    allowedRoles: string[];
    level: SecurityLevel;
}
export interface Message {
    content: string;
    authenticated: boolean;
    encrypted: boolean;
    role?: string;
}
