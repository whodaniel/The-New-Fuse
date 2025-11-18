import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdvancedCacheManager } from './advanced-cache.manager';

export interface SessionData {
  userId: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
  createdAt: number;
  lastActivity: number;
}

export interface SessionOptions {
  ttl?: number;
  sliding?: boolean; // Refresh TTL on access
  maxIdleTime?: number;
}

@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  private readonly defaultTTL: number;
  private readonly defaultMaxIdleTime: number;

  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly configService: ConfigService,
  ) {
    const cacheConfig = this.configService.get('cache');
    this.defaultTTL = cacheConfig?.ttl?.session || 604800; // 7 days
    this.defaultMaxIdleTime = 3600; // 1 hour default max idle time
  }

  /**
   * Create or update a session
   */
  async setSession(
    sessionId: string,
    data: SessionData,
    options: SessionOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;

    const sessionData: SessionData = {
      ...data,
      createdAt: data.createdAt || Date.now(),
      lastActivity: Date.now(),
    };

    await this.cacheManager.set(`session:${sessionId}`, sessionData, {
      ttl,
      prefix: 'auth:',
      tags: ['sessions', `user:${data.userId}`],
    });

    // Also index by user ID for easy lookup
    await this.addSessionToUserIndex(data.userId, sessionId, ttl);

    this.logger.debug(`Session created/updated: ${sessionId} for user ${data.userId}`);
  }

  /**
   * Get a session
   */
  async getSession(
    sessionId: string,
    options: SessionOptions = {},
  ): Promise<SessionData | null> {
    const session = await this.cacheManager.get<SessionData>(
      `session:${sessionId}`,
      { prefix: 'auth:' },
    );

    if (!session) {
      return null;
    }

    // Check if session has exceeded max idle time
    const maxIdleTime = options.maxIdleTime || this.defaultMaxIdleTime;
    const idleTime = (Date.now() - session.lastActivity) / 1000;

    if (idleTime > maxIdleTime) {
      await this.deleteSession(sessionId);
      this.logger.debug(`Session ${sessionId} expired due to inactivity`);
      return null;
    }

    // Refresh TTL if sliding session
    if (options.sliding !== false) {
      await this.refreshSession(sessionId, session, options);
    }

    return session;
  }

  /**
   * Refresh session TTL and update last activity
   */
  async refreshSession(
    sessionId: string,
    session?: SessionData,
    options: SessionOptions = {},
  ): Promise<void> {
    const sessionData = session || await this.getSession(sessionId, { sliding: false });

    if (!sessionData) {
      return;
    }

    sessionData.lastActivity = Date.now();

    const ttl = options.ttl || this.defaultTTL;

    await this.cacheManager.set(`session:${sessionId}`, sessionData, {
      ttl,
      prefix: 'auth:',
      tags: ['sessions', `user:${sessionData.userId}`],
    });

    this.logger.debug(`Session refreshed: ${sessionId}`);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.cacheManager.get<SessionData>(
      `session:${sessionId}`,
      { prefix: 'auth:' },
    );

    if (session) {
      await this.removeSessionFromUserIndex(session.userId, sessionId);
    }

    await this.cacheManager.delete(`session:${sessionId}`, { prefix: 'auth:' });

    this.logger.debug(`Session deleted: ${sessionId}`);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    const sessionIds = await this.getUserSessions(userId);

    for (const sessionId of sessionIds) {
      await this.cacheManager.delete(`session:${sessionId}`, { prefix: 'auth:' });
    }

    await this.cacheManager.delete(`user:sessions:${userId}`, { prefix: 'auth:' });

    this.logger.debug(`Deleted ${sessionIds.length} sessions for user ${userId}`);

    return sessionIds.length;
  }

  /**
   * Get all session IDs for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const sessions = await this.cacheManager.get<string[]>(
      `user:sessions:${userId}`,
      { prefix: 'auth:' },
    );

    return sessions || [];
  }

  /**
   * Get all active sessions for a user with data
   */
  async getUserSessionsWithData(userId: string): Promise<Array<{ id: string; data: SessionData }>> {
    const sessionIds = await this.getUserSessions(userId);

    const sessions = await this.cacheManager.mget<SessionData>(
      sessionIds.map((id) => `session:${id}`),
      { prefix: 'auth:' },
    );

    return sessions
      .map((data, index) => ({
        id: sessionIds[index],
        data: data as SessionData,
      }))
      .filter((s) => s.data !== null);
  }

  /**
   * Check if a session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    return this.cacheManager.exists(`session:${sessionId}`, { prefix: 'auth:' });
  }

  /**
   * Update session data
   */
  async updateSessionData(
    sessionId: string,
    updates: Partial<SessionData>,
    options: SessionOptions = {},
  ): Promise<void> {
    const session = await this.getSession(sessionId, { sliding: false });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };

    const ttl = options.ttl || this.defaultTTL;

    await this.cacheManager.set(`session:${sessionId}`, updatedSession, {
      ttl,
      prefix: 'auth:',
      tags: ['sessions', `user:${updatedSession.userId}`],
    });

    this.logger.debug(`Session data updated: ${sessionId}`);
  }

  /**
   * Get session TTL
   */
  async getSessionTTL(sessionId: string): Promise<number> {
    return this.cacheManager.getTTL(`session:${sessionId}`, { prefix: 'auth:' });
  }

  /**
   * Add session to user's session index
   */
  private async addSessionToUserIndex(
    userId: string,
    sessionId: string,
    ttl: number,
  ): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);

      await this.cacheManager.set(`user:sessions:${userId}`, sessions, {
        ttl,
        prefix: 'auth:',
      });
    }
  }

  /**
   * Remove session from user's session index
   */
  private async removeSessionFromUserIndex(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const filtered = sessions.filter((id) => id !== sessionId);

    if (filtered.length > 0) {
      await this.cacheManager.set(`user:sessions:${userId}`, filtered, {
        ttl: this.defaultTTL,
        prefix: 'auth:',
      });
    } else {
      await this.cacheManager.delete(`user:sessions:${userId}`, { prefix: 'auth:' });
    }
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    return sessions.length;
  }

  /**
   * Limit user sessions to a maximum number (keep most recent)
   */
  async limitUserSessions(userId: string, maxSessions: number): Promise<void> {
    const sessionsWithData = await this.getUserSessionsWithData(userId);

    if (sessionsWithData.length <= maxSessions) {
      return;
    }

    // Sort by last activity (most recent first)
    sessionsWithData.sort((a, b) => b.data.lastActivity - a.data.lastActivity);

    // Delete oldest sessions
    const toDelete = sessionsWithData.slice(maxSessions);

    for (const session of toDelete) {
      await this.deleteSession(session.id);
    }

    this.logger.debug(
      `Limited user ${userId} sessions from ${sessionsWithData.length} to ${maxSessions}`,
    );
  }

  /**
   * Clean up expired sessions (garbage collection)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // This would typically be run as a scheduled job
    // In practice, Redis handles expiration automatically
    // This method is for manual cleanup if needed

    this.logger.log('Session cleanup is handled automatically by Redis TTL');
    return 0;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    sessionsByUser: Map<string, number>;
  }> {
    // This is a simplified implementation
    // In production, you might want to maintain these stats separately

    const stats = {
      totalSessions: 0,
      sessionsByUser: new Map<string, number>(),
    };

    // Note: This would require scanning, which is expensive
    // Consider maintaining stats in a separate data structure

    return stats;
  }
}
