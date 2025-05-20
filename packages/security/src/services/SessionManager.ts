import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  data: Record<string, any>;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  
  createSession(userId: string, ttlMinutes: number = 60): Session {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMinutes(now.getMinutes() + ttlMinutes);
    
    const session: Session = {
      id: uuidv4(),
      userId,
      createdAt: now,
      expiresAt,
      data: {}
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
  
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }
  
  updateSession(sessionId: string, data: Partial<Session['data']>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    session.data = { ...session.data, ...data };
    return true;
  }
  
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

export const sessionManager = new SessionManager();
