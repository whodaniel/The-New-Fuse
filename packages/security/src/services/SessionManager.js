"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
const uuid_1 = require("uuid");
class SessionManager {
    sessions = new Map();
    createSession(userId, ttlMinutes = 60) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMinutes(now.getMinutes() + ttlMinutes);
        const session = {
            id: (0, uuid_1.v4)(),
            userId,
            createdAt: now,
            expiresAt,
            data: {}
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
exports.SessionManager = SessionManager;
exports.sessionManager = new SessionManager();
//# sourceMappingURL=SessionManager.js.map