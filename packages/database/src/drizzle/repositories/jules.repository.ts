/**
 * Jules Repository - Drizzle ORM Implementation
 * Provides data access for Jules integration (configs, sessions, usage logs)
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../client.js';
import { julesConfigs, julesSessions, julesUsageLogs } from '../schema/index.js';
import type {
  JulesConfig,
  JulesSession,
  JulesUsageLog,
  NewJulesConfig,
  NewJulesSession,
  NewJulesUsageLog,
} from '../types/jules.js';

/**
 * Jules Repository - provides data access for Jules-related entities
 */
export class DrizzleJulesRepository {
  // =============================================================================
  // JULES CONFIGS
  // =============================================================================

  /**
   * Create a new Jules configuration
   */
  async createConfig(data: NewJulesConfig): Promise<JulesConfig> {
    const [config] = await db.insert(julesConfigs).values(data).returning();
    return config;
  }

  /**
   * Find Jules config by user ID
   */
  async findConfigByUserId(userId: string): Promise<JulesConfig | null> {
    const [config] = await db
      .select()
      .from(julesConfigs)
      .where(and(eq(julesConfigs.userId, userId), isNull(julesConfigs.deletedAt)));

    return config ?? null;
  }

  /**
   * Update Jules configuration
   */
  async updateConfig(
    id: string,
    data: Partial<Omit<JulesConfig, 'id' | 'createdAt'>>
  ): Promise<JulesConfig | null> {
    const [updated] = await db
      .update(julesConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(julesConfigs.id, id))
      .returning();

    return updated ?? null;
  }

  // =============================================================================
  // JULES SESSIONS
  // =============================================================================

  /**
   * Create a new Jules session
   */
  async createSession(data: NewJulesSession): Promise<JulesSession> {
    const [session] = await db.insert(julesSessions).values(data).returning();
    return session;
  }

  /**
   * Find Jules session by Jules session ID
   */
  async findSessionByJulesSessionId(julesSessionId: string): Promise<JulesSession | null> {
    const [session] = await db
      .select()
      .from(julesSessions)
      .where(
        and(eq(julesSessions.julesSessionId, julesSessionId), isNull(julesSessions.deletedAt))
      );

    return session ?? null;
  }

  /**
   * Find Jules session by task ID
   */
  async findSessionByTaskId(taskId: string): Promise<JulesSession | null> {
    const [session] = await db
      .select()
      .from(julesSessions)
      .where(and(eq(julesSessions.taskId, taskId), isNull(julesSessions.deletedAt)));

    return session ?? null;
  }

  /**
   * Find all sessions for a user
   */
  async findSessionsByUserId(userId: string): Promise<JulesSession[]> {
    return db
      .select()
      .from(julesSessions)
      .where(and(eq(julesSessions.userId, userId), isNull(julesSessions.deletedAt)))
      .orderBy(desc(julesSessions.createdAt));
  }

  /**
   * Update Jules session
   */
  async updateSession(
    id: string,
    data: Partial<Omit<JulesSession, 'id' | 'createdAt'>>
  ): Promise<JulesSession | null> {
    const [updated] = await db
      .update(julesSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(julesSessions.id, id))
      .returning();

    return updated ?? null;
  }

  /**
   * Update Jules session by Jules session ID
   */
  async updateSessionByJulesSessionId(
    julesSessionId: string,
    data: Partial<Omit<JulesSession, 'id' | 'createdAt' | 'julesSessionId'>>
  ): Promise<JulesSession | null> {
    const [updated] = await db
      .update(julesSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(julesSessions.julesSessionId, julesSessionId))
      .returning();

    return updated ?? null;
  }

  // =============================================================================
  // JULES USAGE LOGS
  // =============================================================================

  /**
   * Create a new usage log entry
   */
  async createUsageLog(data: NewJulesUsageLog): Promise<JulesUsageLog> {
    const [log] = await db.insert(julesUsageLogs).values(data).returning();
    return log;
  }

  /**
   * Find usage logs for a session
   */
  async findUsageLogsBySessionId(sessionId: string): Promise<JulesUsageLog[]> {
    return db
      .select()
      .from(julesUsageLogs)
      .where(eq(julesUsageLogs.sessionId, sessionId))
      .orderBy(desc(julesUsageLogs.createdAt));
  }

  /**
   * Find usage logs for a user
   */
  async findUsageLogsByUserId(userId: string): Promise<JulesUsageLog[]> {
    return db
      .select()
      .from(julesUsageLogs)
      .where(eq(julesUsageLogs.userId, userId))
      .orderBy(desc(julesUsageLogs.createdAt));
  }

  /**
   * Update usage log
   */
  async updateUsageLog(
    id: string,
    data: Partial<Omit<JulesUsageLog, 'id' | 'createdAt'>>
  ): Promise<JulesUsageLog | null> {
    const [updated] = await db
      .update(julesUsageLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(julesUsageLogs.id, id))
      .returning();

    return updated ?? null;
  }
}

// Singleton instance
export const drizzleJulesRepository = new DrizzleJulesRepository();
