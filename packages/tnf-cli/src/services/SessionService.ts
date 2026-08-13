import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Session {
  id: string;
  name: string;
  model: string;
  provider: string;
  startTime: string;
  endTime?: string;
  messageCount: number;
  tokenCount: number;
  cost?: number;
  tags: string[];
  status: 'active' | 'closed' | 'archived';
  path?: string;
  lastMessageAt?: string;
}

export class SessionService {
  private sessionsDir: string;
  private sessionsFile: string;

  constructor() {
    this.sessionsDir = path.join(os.homedir(), '.tnf', 'sessions');
    this.sessionsFile = path.join(this.sessionsDir, 'sessions.json');
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  private loadSessions(): Session[] {
    try {
      return JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
    } catch { return []; }
  }

  private saveSessions(sessions: Session[]) {
    fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
  }

  async list(): Promise<Session[]> {
    return this.loadSessions().sort((a, b) => new Date(b.lastMessageAt || b.startTime).getTime() - new Date(a.lastMessageAt || a.startTime).getTime());
  }

  async get(id: string): Promise<Session | undefined> {
    return this.loadSessions().find(s => s.id === id);
  }

  async create(name: string, model: string, provider: string): Promise<Session> {
    const sessions = this.loadSessions();
    const session: Session = {
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

  async rename(id: string, newName: string): Promise<Session | null> {
    const sessions = this.loadSessions();
    const session = sessions.find(s => s.id === id);
    if (!session) return null;
    session.name = newName;
    this.saveSessions(sessions);
    return session;
  }

  async delete(id: string): Promise<boolean> {
    const sessions = this.loadSessions();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === sessions.length) return false;
    this.saveSessions(filtered);
    return true;
  }

  async archive(id: string): Promise<boolean> {
    const sessions = this.loadSessions();
    const session = sessions.find(s => s.id === id);
    if (!session) return false;
    session.status = 'archived';
    this.saveSessions(sessions);
    return true;
  }

  async export(id: string, format: 'json' | 'md' | 'txt'): Promise<string> {
    const session = await this.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    if (format === 'json') return JSON.stringify(session, null, 2);
    if (format === 'md') return `# ${session.name}\n\n- ID: ${session.id}\n- Model: ${session.model}\n- Provider: ${session.provider}\n- Started: ${session.startTime}\n- Messages: ${session.messageCount}\n- Tokens: ${session.tokenCount}\n`;
    return `Session: ${session.name}\nID: ${session.id}\nModel: ${session.model}\nProvider: ${session.provider}\n`;
  }

  async prune(keep: number): Promise<number> {
    const sessions = this.loadSessions();
    const sorted = sessions.sort((a, b) => new Date(b.lastMessageAt || b.startTime).getTime() - new Date(a.lastMessageAt || a.startTime).getTime());
    if (sorted.length <= keep) return 0;
    const toDelete = sorted.slice(keep);
    const remaining = sorted.filter(s => !toDelete.find(d => d.id === s.id));
    this.saveSessions(remaining);
    return toDelete.length;
  }
}
