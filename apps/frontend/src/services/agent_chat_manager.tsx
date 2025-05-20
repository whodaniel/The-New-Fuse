import { sessionManager, Session } from '@your-org/security';
import { ChatService } from './chat.service.js';

interface ChatSession {
  id: string;
  agentId: string;
  messages: Array<{ content: string; timestamp: Date }>;
  metadata: Record<string, unknown>;
}

export class AgentChatManager extends EventEmitter {
  private activeSessions: Map<string, ChatSession> = new Map();

  constructor(private readonly chatService: ChatService) {
    super();
  }

  async createSession(agentId: string, metadata: Record<string, unknown> = {}): Promise<ChatSession> {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      agentId,
      messages: [],
      metadata
    };

    this.activeSessions.set(session.id, session);
    this.emit('sessionCreated', session);
    return session;
  }

  async sendMessage(sessionId: string, content: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await this.chatService.sendMessage(content, {
      sessionId,
      agentId: session.agentId,
      ...session.metadata
    });

    session.messages.push({
      content,
      timestamp: new Date()
    });
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }

  closeSession(sessionId: string): void {
    if (this.activeSessions.has(sessionId)) {
      const session = this.activeSessions.get(sessionId)!;
      this.activeSessions.delete(sessionId);
      this.emit('sessionClosed', session);
    }
  }
}//# sourceMappingURL=agent_chat_manager.js.map
