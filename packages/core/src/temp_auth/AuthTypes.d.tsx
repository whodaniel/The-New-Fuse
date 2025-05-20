import { z } from 'zod';
export interface AuthConfig {
    jwtSecret: string;
    tokenExpiration: number;
    refreshTokenExpiration: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge: number;
    };
}
export interface TokenPayload {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
    issuedAt: number;
    expiresAt: number;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    issuedAt: number;
    expiresAt: number;
}
export interface AuthSession {
    id: string;
    userId: string;
    deviceInfo: {
        type: string;
        os: string;
        browser: string;
        ip: string;
    };
    issuedAt: Date;
    lastActive: Date;
    expiresAt: Date;
    isRevoked: boolean;
}
export interface LoginAttempt {
    userId: string;
    timestamp: Date;
    success: boolean;
    ip: string;
    userAgent: string;
    error?: string;
}
export interface AuthEvent {
    type: AuthEventType;
    userId: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export declare enum AuthEventType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    TOKEN_REFRESH = "TOKEN_REFRESH",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    SESSION_REVOKED = "SESSION_REVOKED",
    LOGIN_FAILED = "LOGIN_FAILED",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
}
export declare const AuthConfigSchema: z.string;
export declare const TokenPayloadSchema: z.string;
export declare const RefreshTokenPayloadSchema: z.string;
export declare const AuthSessionSchema: z.ZodObject<z.ZodRawShape, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
