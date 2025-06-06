import { AuthUser } from './auth.js';
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivityAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
}
export interface SessionManager {
    createSession(user: AuthUser, token: string, ipAddress?: string, userAgent?: string): Promise<Session>;
    validateSession(sessionId: string): Promise<boolean>;
    refreshSession(sessionId: string): Promise<Session>;
    revokeSession(sessionId: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<void>;
    getActiveUserSessions(userId: string): Promise<Session[]>;
}
export interface SessionOptions {
    maxConcurrentSessions?: number;
    sessionTimeout?: number;
    extendOnActivity?: boolean;
    requireIpMatch?: boolean;
    requireUserAgentMatch?: boolean;
}
export interface SessionStore {
    get(sessionId: string): Promise<Session | null>;
    set(session: Session): Promise<void>;
    delete(sessionId: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
    findByUserId(userId: string): Promise<Session[]>;
    cleanup(): Promise<void>;
}
export interface SessionMetadata {
    lastIpAddress?: string;
    lastUserAgent?: string;
    loginAttempts: number;
    lastLoginAttempt?: Date;
    isLocked: boolean;
    lockExpiresAt?: Date;
}
