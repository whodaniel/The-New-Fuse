import { v4 as uuidv4 } from 'uuid';
export class SessionManager {
    constructor() {
        this.sessions = new Map();
    }
    createSession(userId, ttlMinutes = 60) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMinutes(now.getMinutes() + ttlMinutes);
        const session = {
            id: uuidv4(),
            userId,
            createdAt: now,
            expiresAt,
            data: {},
        };
        this.sessions.set(session.id, session);
        return session;
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return undefined;
        // Check if expired
        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return undefined;
        }
        return session;
    }
    updateSession(sessionId, data) {
        const session = this.getSession(sessionId);
        if (!session)
            return false;
        session.data = { ...session.data, ...data };
        return true;
    }
    destroySession(sessionId) {
        return this.sessions.delete(sessionId);
    }
}
export const sessionManager = new SessionManager();
//# sourceMappingURL=SessionManager.js.map