import { EventEmitter } from 'events';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class ChatManager extends EventEmitter {
  private sessions: Map<string, ChatSession> = new Map();

  createSession(id?: string): ChatSession {
    const sessionId = id || `session_${Date.now()}`;
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(sessionId, session);
    this.emit('session:created', session);
    return session;
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  listSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  addMessage(sessionId: string, role: ChatMessage['role'], content: string, metadata?: Record<string, unknown>): ChatMessage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    const message: ChatMessage = {
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

  deleteSession(id: string): boolean {
    const existed = this.sessions.delete(id);
    if (existed) {
      this.emit('session:deleted', { id });
    }
    return existed;
  }
}
