import { EventEmitter } from 'events';
export class ChatManager extends EventEmitter {
    constructor() {
        super(...arguments);
        this.sessions = new Map();
    }
    createSession(id) {
        const sessionId = id || `session_${Date.now()}`;
        const now = new Date().toISOString();
        const session = {
            id: sessionId,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };
        this.sessions.set(sessionId, session);
        this.emit('session:created', session);
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    listSessions() {
        return Array.from(this.sessions.values());
    }
    addMessage(sessionId, role, content, metadata) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const message = {
            id: `msg_${Date.now()}`,
            role,
            content,
            timestamp: new Date().toISOString(),
            metadata,
        };
        session.messages.push(message);
        session.updatedAt = new Date().toISOString();
        this.emit('message:added', { session, message });
        return message;
    }
    deleteSession(id) {
        const existed = this.sessions.delete(id);
        if (existed) {
            this.emit('session:deleted', { id });
        }
        return existed;
    }
}
//# sourceMappingURL=ChatManager.js.map