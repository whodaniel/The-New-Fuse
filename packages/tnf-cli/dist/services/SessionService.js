import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class SessionService {
    constructor() {
        this.sessionsDir = path.join(os.homedir(), '.tnf', 'sessions');
        this.sessionsFile = path.join(this.sessionsDir, 'sessions.json');
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }
    loadSessions() {
        try {
            return JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
        }
        catch {
            return [];
        }
    }
    saveSessions(sessions) {
        fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
    }
    async list() {
        return this.loadSessions().sort((a, b) => new Date(b.lastMessageAt || b.startTime).getTime() - new Date(a.lastMessageAt || a.startTime).getTime());
    }
    async get(id) {
        return this.loadSessions().find(s => s.id === id);
    }
    async create(name, model, provider) {
        const sessions = this.loadSessions();
        const session = {
            id: `sess-${Date.now().toString(36)}`,
            name: name || `Session ${sessions.length + 1}`,
            model,
            provider,
            startTime: new Date().toISOString(),
            messageCount: 0,
            tokenCount: 0,
            tags: [],
            status: 'active',
        };
        sessions.push(session);
        this.saveSessions(sessions);
        return session;
    }
    async rename(id, newName) {
        const sessions = this.loadSessions();
        const session = sessions.find(s => s.id === id);
        if (!session)
            return null;
        session.name = newName;
        this.saveSessions(sessions);
        return session;
    }
    async delete(id) {
        const sessions = this.loadSessions();
        const filtered = sessions.filter(s => s.id !== id);
        if (filtered.length === sessions.length)
            return false;
        this.saveSessions(filtered);
        return true;
    }
    async archive(id) {
        const sessions = this.loadSessions();
        const session = sessions.find(s => s.id === id);
        if (!session)
            return false;
        session.status = 'archived';
        this.saveSessions(sessions);
        return true;
    }
    async export(id, format) {
        const session = await this.get(id);
        if (!session)
            throw new Error(`Session not found: ${id}`);
        if (format === 'json')
            return JSON.stringify(session, null, 2);
        if (format === 'md')
            return `# ${session.name}\n\n- ID: ${session.id}\n- Model: ${session.model}\n- Provider: ${session.provider}\n- Started: ${session.startTime}\n- Messages: ${session.messageCount}\n- Tokens: ${session.tokenCount}\n`;
        return `Session: ${session.name}\nID: ${session.id}\nModel: ${session.model}\nProvider: ${session.provider}\n`;
    }
    async prune(keep) {
        const sessions = this.loadSessions();
        const sorted = sessions.sort((a, b) => new Date(b.lastMessageAt || b.startTime).getTime() - new Date(a.lastMessageAt || a.startTime).getTime());
        if (sorted.length <= keep)
            return 0;
        const toDelete = sorted.slice(keep);
        const remaining = sorted.filter(s => !toDelete.find(d => d.id === s.id));
        this.saveSessions(remaining);
        return toDelete.length;
    }
}
//# sourceMappingURL=SessionService.js.map