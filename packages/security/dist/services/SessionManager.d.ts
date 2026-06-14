export interface Session {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    data: Record<string, any>;
}
export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    roles: string[];
    permissions?: string[];
}
export declare class SessionManager {
    private sessions;
    createSession(userId: string, ttlMinutes?: number): Session;
    getSession(sessionId: string): Session | undefined;
    updateSession(sessionId: string, data: Partial<Session['data']>): boolean;
    destroySession(sessionId: string): boolean;
}
export declare const sessionManager: SessionManager;
//# sourceMappingURL=SessionManager.d.ts.map