import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunicationService } from '../communication/CommunicationService';

export interface CollaborationSession {
  id: string;
  participants: string[];
  documentId: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface CollaborationChange {
  sessionId: string;
  userId: string;
  change: any;
  timestamp: Date;
}

@Injectable()
export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private changes: Map<string, CollaborationChange[]> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private communicationService: CommunicationService,
  ) {}

  async createSession(documentId: string, userId: string): Promise<CollaborationSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      participants: [userId],
      documentId,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.changes.set(sessionId, []);

    this.eventEmitter.emit('collaboration.session.created', { session, userId });

    return session;
  }

  async joinSession(sessionId: string, userId: string): Promise<CollaborationSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      session.lastActivity = new Date();
    }

    this.eventEmitter.emit('collaboration.user.joined', { sessionId, userId });

    return session;
  }

  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.participants = session.participants.filter(id => id !== userId);
    session.lastActivity = new Date();

    if (session.participants.length === 0) {
      this.sessions.delete(sessionId);
      this.changes.delete(sessionId);
    }

    this.eventEmitter.emit('collaboration.user.left', { sessionId, userId });

    return true;
  }

  async recordChange(sessionId: string, userId: string, change: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const collaborationChange: CollaborationChange = {
      sessionId,
      userId,
      change,
      timestamp: new Date(),
    };

    const sessionChanges = this.changes.get(sessionId) || [];
    sessionChanges.push(collaborationChange);
    this.changes.set(sessionId, sessionChanges);

    session.lastActivity = new Date();

    this.eventEmitter.emit('collaboration.change.recorded', collaborationChange);
  }

  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessionChanges(sessionId: string): Promise<CollaborationChange[]> {
    return this.changes.get(sessionId) || [];
  }

  async getActiveSessions(): Promise<CollaborationSession[]> {
    return Array.from(this.sessions.values());
  }
}