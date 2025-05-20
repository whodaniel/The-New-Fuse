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
export declare class SessionManager {
  private cache;
  private time;
  private logger;
  constructor(cache: ICacheService, time: TimeService, logger: ILogger);
  /**
   * Generate session key for cache
   */
  private getSessionKey;
  /**
   * Generate user sessions key for cache
   */
  private getUserSessionsKey;
  /**
   * Create a new session
   */
  createSession(
    userId: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      expiresInSeconds?: number;
      data?: Record<string, unknown>;
    },
  ): Promise<Session>;
  /**
   * Get session by ID
   */
  getSession(sessionId: string): Promise<Session | null>;
  /**
   * Update a session
   */
  updateSession(
    sessionId: string,
    data: Partial<Record<string, unknown>>,
  ): Promise<Session | null>;
  /**
   * Extend session expiration
   */
  extendSession(
    sessionId: string,
    expiresInSeconds: number,
  ): Promise<Session | null>;
  /**
   * Generate a random session ID
   */
  private generateSessionId;
  /**
   * Add a session ID to user's sessions list
   */
  private addSessionToUser;
  /**
   * Remove a session ID from user's sessions list
   */
  private removeSessionFromUser;
  /**
   * Destroy a session
   */
  destroySession(sessionId: string): Promise<boolean>;
  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Promise<Session[]>;
  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): Promise<number>;
}
