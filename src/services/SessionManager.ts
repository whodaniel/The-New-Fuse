import { Injectable, Scope } from "@nestjs/common";
import type { ILogger, ICacheService } from '../core/di/types.js';
import { TimeService } from '../utils/time.service.js';

// Define Session interfaces
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActive?: Date;
  data: Record<string, unknown>;
}

@Injectable({ scope: Scope.REQUEST })
export class SessionManager {
  constructor(
    private cache: ICacheService,
    private time: TimeService,
    private logger: ILogger,
  ) {}

  /**
   * Generate session key for cache
   */
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  /**
   * Generate user sessions key for cache
   */
  private getUserSessionsKey(userId: string): string {
    return `user:${userId}:sessions`;
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      expiresInSeconds?: number;
      data?: Record<string, unknown>;
    } = {},
  ): Promise<Session> {
    const now = new Date();
    const sessionId = this.generateSessionId();
    const session: Session = {
      id: sessionId,
      userId: userId,
      createdAt: now,
      expiresAt: this.time.addToDate(now, {
        seconds: options.expiresInSeconds || 86400, // Default to 1 day
      }),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      lastActive: now,
      data: options.data || {},
    };

    // Store session in cache
    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000),
    );

    // Add session ID to user's sessions list
    await this.addSessionToUser(userId, sessionId);

    // Log session creation
    this.logger.info("Session created", {
      context: {
        sessionId,
        userId,
        ipAddress: options.ipAddress,
        expiresAt: session.expiresAt,
      },
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.cache.get<Session>(
      this.getSessionKey(sessionId),
    );

    if (!session) return null;

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update a session
   */
  async updateSession(
    sessionId: string,
    data: Partial<Record<string, unknown>>,
  ): Promise<Session | null> {
    const session = await this.getSession(sessionId);

    if (!session) return null;

    // Update session data
    session.data = { ...session.data, ...data };
    session.lastActive = new Date();

    // Store updated session
    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      Math.floor((session.expiresAt.getTime() - new Date().getTime()) / 1000),
    );

    return session;
  }

  /**
   * Update session expiration
   */
  async updateSessionExpiration(
    sessionId: string,
    expiresInSeconds: number,
  ): Promise<Session | null> {
    const session = await this.getSession(sessionId);

    if (!session) return null;

    // Update expiration
    session.expiresAt = this.time.addToDate(new Date(), {
      seconds: expiresInSeconds,
    });
    session.lastActive = new Date();

    // Store updated session
    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      expiresInSeconds,
    );

    return session;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Add session ID to user's sessions list
   */
  private async addSessionToUser(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = this.getUserSessionsKey(userId);
    const sessions = (await this.cache.get<string[]>(key)) || [];

    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);
      await this.cache.set(key, sessions);
    }
  }

  /**
   * Remove session ID from user's sessions list
   */
  private async removeSessionFromUser(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = this.getUserSessionsKey(userId);
    const sessions = (await this.cache.get<string[]>(key)) || [];
    const updatedSessions = sessions.filter((id) => id !== sessionId);
    await this.cache.set(key, updatedSessions);
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) return false;

    // Remove session from cache
    await this.cache.delete(this.getSessionKey(sessionId));

    // Remove session from user's sessions list
    await this.removeSessionFromUser(session.userId, sessionId);

    // Log session destruction
    this.logger.info("Session destroyed", {
      context: {
        sessionId,
        userId: session.userId,
      },
    });

    return true;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds =
      (await this.cache.get<string[]>(this.getUserSessionsKey(userId))) || [];

    const sessions: Session[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);

    // Delete each session
    for (const session of sessions) {
      await this.cache.delete(this.getSessionKey(session.id));
    }

    // Clear the user's sessions list
    await this.cache.delete(this.getUserSessionsKey(userId));

    // Log user sessions destroyed
    this.logger.info("User sessions destroyed", {
      context: {
        userId,
        sessionCount: sessions.length,
      },
    });

    return sessions.length;
  }
}
