import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface Session {
  id: string;
  name?: string;
  provider: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  totalTokens?: number;
  totalCost?: number;
  projectPath?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
}

export interface SessionExport {
  session: Session;
  messages: SessionMessage[];
}

export class SessionManagerService {
  private sessionsDir: string;
  private sessions: Map<string, Session> = new Map();

  constructor(sessionsDir?: string) {
    this.sessionsDir = sessionsDir || path.join(os.homedir(), '.local', 'share', 'tnf', 'sessions');
    this.loadSessionsIndex();
  }

  private loadSessionsIndex(): void {
    const indexPath = path.join(this.sessionsDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        if (Array.isArray(data)) {
          for (const session of data) {
            this.sessions.set(session.id, session);
          }
        }
      } catch {}
    }
  }

  private saveSessionsIndex(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
    const indexPath = path.join(this.sessionsDir, 'index.json');
    const sessionsArray = Array.from(this.sessions.values());
    fs.writeFileSync(indexPath, JSON.stringify(sessionsArray, null, 2));
  }

  list(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  create(options: {
    name?: string;
    provider: string;
    model: string;
    projectPath?: string;
  }): Session {
    const id = this.generateId();
    const now = new Date().toISOString();
    const session: Session = {
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

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  update(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(id, updated);
    this.saveSessionsIndex();
    return updated;
  }

  delete(id: string): { success: boolean; message: string } {
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
      } catch (e) {
        return {
          success: false,
          message: `Session removed from index but file deletion failed: ${(e as Error).message}`,
        };
      }
    }

    return { success: true, message: `Session '${session.name || id}' deleted` };
  }

  private saveSessionFile(session: Session, messages: SessionMessage[]): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
    const sessionFile = path.join(this.sessionsDir, `${session.id}.json`);
    const data: SessionExport = { session, messages };
    fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
  }

  private loadSessionFile(id: string): SessionExport | undefined {
    const sessionFile = path.join(this.sessionsDir, `${id}.json`);
    if (!fs.existsSync(sessionFile)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    } catch {
      return undefined;
    }
  }

  export(id: string): SessionExport | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const data = this.loadSessionFile(id);
    if (data) return data;

    return { session, messages: [] };
  }

  exportAll(): SessionExport[] {
    const exports: SessionExport[] = [];
    for (const session of this.sessions.values()) {
      const data = this.loadSessionFile(session.id);
      if (data) {
        exports.push(data);
      } else {
        exports.push({ session, messages: [] });
      }
    }
    return exports;
  }

  /**
   * Memory-efficient streaming export to prevent OOM errors.
   */
  async exportAllToStream(outputFilePath: string): Promise<void> {
    const stream = fs.createWriteStream(outputFilePath);
    stream.write('{\n  "sessions": [\n');
    let first = true;
    for (const session of this.sessions.values()) {
      if (!first) stream.write(',\n');
      const data = this.loadSessionFile(session.id) || { session, messages: [] };
      stream.write(
        JSON.stringify(data, null, 2)
          .split('\n')
          .map((line) => '    ' + line)
          .join('\n')
      );
      first = false;
    }
    stream.write('\n  ]\n}\n');
    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', (err) => {
        stream.close();
        reject(err);
      });
      stream.end();
    });
  }

  import(
    data: SessionExport,
    options?: { overwrite?: boolean }
  ): { success: boolean; id: string; message: string } {
    if (!options?.overwrite && this.sessions.has(data.session.id)) {
      const newId = this.generateId();
      data.session.id = newId;
    }

    this.sessions.set(data.session.id, data.session);
    this.saveSessionsIndex();
    this.saveSessionFile(data.session, data.messages);

    return {
      success: true,
      id: data.session.id,
      message: `Session imported as ${data.session.name || data.session.id}`,
    };
  }

  importFromFile(
    filePath: string,
    options?: { overwrite?: boolean }
  ): { success: boolean; id: string; message: string } {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data: SessionExport = JSON.parse(content);
      return this.import(data, options);
    } catch (e) {
      return {
        success: false,
        id: '',
        message: `Failed to import session: ${(e as Error).message}`,
      };
    }
  }

  importFromUrl(url: string): Promise<{ success: boolean; id: string; message: string }> {
    return fetch(url)
      .then((res) => res.json())
      .then((data) => this.import(data as SessionExport))
      .catch((e) => ({
        success: false,
        id: '',
        message: `Failed to import session from URL: ${(e as Error).message}`,
      }));
  }
}
