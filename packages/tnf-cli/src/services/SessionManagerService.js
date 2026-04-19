import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class SessionManagerService {
    constructor(sessionsDir) {
        this.sessions = new Map();
        this.sessionsDir = sessionsDir || path.join(os.homedir(), '.local', 'share', 'tnf', 'sessions');
        this.loadSessionsIndex();
    }
    loadSessionsIndex() {
        const indexPath = path.join(this.sessionsDir, 'index.json');
        if (fs.existsSync(indexPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
                if (Array.isArray(data)) {
                    for (const session of data) {
                        this.sessions.set(session.id, session);
                    }
                }
            }
            catch { }
        }
    }
    saveSessionsIndex() {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
        const indexPath = path.join(this.sessionsDir, 'index.json');
        const sessionsArray = Array.from(this.sessions.values());
        fs.writeFileSync(indexPath, JSON.stringify(sessionsArray, null, 2));
    }
    list() {
        return Array.from(this.sessions.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    get(id) {
        return this.sessions.get(id);
    }
    create(options) {
        const id = this.generateId();
        const now = new Date().toISOString();
        const session = {
            id,
            name: options.name || `Session ${this.sessions.size + 1}`,
            provider: options.provider,
            model: options.model,
            createdAt: now,
            updatedAt: now,
            messageCount: 0,
            projectPath: options.projectPath,
        };
        this.sessions.set(id, session);
        this.saveSessionsIndex();
        this.saveSessionFile(session, []);
        return session;
    }
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }
    update(id, updates) {
        const session = this.sessions.get(id);
        if (!session)
            return undefined;
        const updated = {
            ...session,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.sessions.set(id, updated);
        this.saveSessionsIndex();
        return updated;
    }
    delete(id) {
        const session = this.sessions.get(id);
        if (!session) {
            return { success: false, message: `Session '${id}' not found` };
        }
        this.sessions.delete(id);
        this.saveSessionsIndex();
        const sessionFile = path.join(this.sessionsDir, `${id}.json`);
        if (fs.existsSync(sessionFile)) {
            try {
                fs.rmSync(sessionFile);
            }
            catch (e) {
                return { success: false, message: `Session removed from index but file deletion failed: ${e.message}` };
            }
        }
        return { success: true, message: `Session '${session.name || id}' deleted` };
    }
    saveSessionFile(session, messages) {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
        const sessionFile = path.join(this.sessionsDir, `${session.id}.json`);
        const data = { session, messages };
        fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
    }
    loadSessionFile(id) {
        const sessionFile = path.join(this.sessionsDir, `${id}.json`);
        if (!fs.existsSync(sessionFile))
            return undefined;
        try {
            return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        }
        catch {
            return undefined;
        }
    }
    export(id) {
        const session = this.sessions.get(id);
        if (!session)
            return undefined;
        const data = this.loadSessionFile(id);
        if (data)
            return data;
        return { session, messages: [] };
    }
    exportAll() {
        const exports = [];
        for (const session of this.sessions.values()) {
            const data = this.loadSessionFile(session.id);
            if (data) {
                exports.push(data);
            }
            else {
                exports.push({ session, messages: [] });
            }
        }
        return exports;
    }
    import(data, options) {
        if (!options?.overwrite && this.sessions.has(data.session.id)) {
            const newId = this.generateId();
            data.session.id = newId;
        }
        this.sessions.set(data.session.id, data.session);
        this.saveSessionsIndex();
        this.saveSessionFile(data.session, data.messages);
        return { success: true, id: data.session.id, message: `Session imported as ${data.session.name || data.session.id}` };
    }
    importFromFile(filePath, options) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            return this.import(data, options);
        }
        catch (e) {
            return { success: false, id: '', message: `Failed to import session: ${e.message}` };
        }
    }
    importFromUrl(url) {
        return fetch(url)
            .then(res => res.json())
            .then(data => this.import(data))
            .catch(e => ({ success: false, id: '', message: `Failed to import session from URL: ${e.message}` }));
    }
}
//# sourceMappingURL=SessionManagerService.js.map