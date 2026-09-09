import * as fs from 'fs';
import * as path from 'path';
import {
  accountOwnedStamp,
  mergeRecordsById,
  resolveAccountOwnedRoot,
  stampRecord,
  TNF_HOME,
  tryResolveAccountOwnedRoot,
} from './AccountOwnedPath.js';

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
  /** Owning authenticated TNF account (cloud identity key). */
  ownerAccountId?: string;
  /** Stable per-user id (profile_id) owning this session. */
  ownerUserId?: string;
}

export class SessionService {
  constructor() {}

  /** Legacy flat ~/.tnf/sessions/sessions.json — read fallback for pre-binding data. */
  private legacySessionsFile(): string {
    return path.join(TNF_HOME(), 'sessions', 'sessions.json');
  }

  /**
   * Account-nested write file ~/.tnf/sessions/<ownerUserId>/sessions.json.
   * Fail closed: throws when no TNF account binding is available.
   */
  private sessionsFileForWrite(): string {
    const owned = resolveAccountOwnedRoot('sessions');
    fs.mkdirSync(owned.root, { recursive: true, mode: 0o700 });
    return path.join(owned.root, 'sessions.json');
  }

  private sessionsFilesForRead(): string[] {
    const ownedRoot = tryResolveAccountOwnedRoot('sessions')?.root;
    const ownedFile = ownedRoot ? path.join(ownedRoot, 'sessions.json') : null;
    const legacyFile = this.legacySessionsFile();
    return ownedFile && ownedFile !== legacyFile ? [ownedFile, legacyFile] : [legacyFile];
  }

  private loadSessions(): Session[] {
    const lists: Session[][] = [];
    for (const file of this.sessionsFilesForRead()) {
      if (!fs.existsSync(file)) continue;
      try {
        lists.push(JSON.parse(fs.readFileSync(file, 'utf8')) as Session[]);
      } catch {
        /* fall through to next candidate */
      }
    }
    // Owned rows win on id collision; legacy rows stay visible until adopted.
    return mergeRecordsById(lists);
  }

  private saveSessions(sessions: Session[]) {
    const owned = resolveAccountOwnedRoot('sessions');
    const stamp = accountOwnedStamp(owned);
    const stamped = sessions.map((s) => stampRecord(s, stamp));
    fs.mkdirSync(owned.root, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(owned.root, 'sessions.json'), JSON.stringify(stamped, null, 2), {
      mode: 0o600,
    });
  }

  async list(): Promise<Session[]> {
    return this.loadSessions().sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.startTime).getTime() -
        new Date(a.lastMessageAt || a.startTime).getTime()
    );
  }

  async get(id: string): Promise<Session | undefined> {
    return this.loadSessions().find((s) => s.id === id);
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
    const session = sessions.find((s) => s.id === id);
    if (!session) return null;
    session.name = newName;
    this.saveSessions(sessions);
    return session;
  }

  async delete(id: string): Promise<boolean> {
    const sessions = this.loadSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === sessions.length) return false;
    this.saveSessions(filtered);
    return true;
  }

  async archive(id: string): Promise<boolean> {
    const sessions = this.loadSessions();
    const session = sessions.find((s) => s.id === id);
    if (!session) return false;
    session.status = 'archived';
    this.saveSessions(sessions);
    return true;
  }

  async export(id: string, format: 'json' | 'md' | 'txt'): Promise<string> {
    const session = await this.get(id);
    if (!session) throw new Error(`Session not found: ${id}`);
    if (format === 'json') return JSON.stringify(session, null, 2);
    if (format === 'md')
      return `# ${session.name}\n\n- ID: ${session.id}\n- Model: ${session.model}\n- Provider: ${session.provider}\n- Started: ${session.startTime}\n- Messages: ${session.messageCount}\n- Tokens: ${session.tokenCount}\n`;
    return `Session: ${session.name}\nID: ${session.id}\nModel: ${session.model}\nProvider: ${session.provider}\n`;
  }

  async prune(keep: number): Promise<number> {
    const sessions = this.loadSessions();
    const sorted = sessions.sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.startTime).getTime() -
        new Date(a.lastMessageAt || a.startTime).getTime()
    );
    if (sorted.length <= keep) return 0;
    const toDelete = sorted.slice(keep);
    const remaining = sorted.filter((s) => !toDelete.find((d) => d.id === s.id));
    this.saveSessions(remaining);
    return toDelete.length;
  }
}
