import { z } from 'zod';
export interface AuthUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
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
export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    issuedAt: number;
    expiresAt: number;
}
export declare const UserCredentialsSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    email?: string | undefined;
}, {
    password: string;
    username: string;
    email?: string | undefined;
}>;
export declare const TokenPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    sessionId: z.ZodString;
    issuedAt: z.ZodNumber;
    expiresAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userId: string;
    expiresAt: number;
    username: string;
    sessionId: string;
    permissions: string[];
    issuedAt: number;
    roles: string[];
}, {
    userId: string;
    expiresAt: number;
    username: string;
    sessionId: string;
    permissions: string[];
    issuedAt: number;
    roles: string[];
}>;
export type UserCredentials = z.infer<typeof UserCredentialsSchema>;
export type ValidatedTokenPayload = z.infer<typeof TokenPayloadSchema>;
export interface AuthResult {
    success: boolean;
    token?: string;
    user?: AuthUser;
    error?: string;
}
export interface Permission {
    resource: string;
    action: string;
    attributes?: string[];
}
export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}
