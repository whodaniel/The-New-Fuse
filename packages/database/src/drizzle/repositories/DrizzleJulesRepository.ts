/**
 * Jules Repository - Drizzle ORM Implementation
 */
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../client';
import { julesConfigs, julesSessions, julesUsageLogs } from '../schema';
import type {
  JulesConfig,
  JulesSession,
  JulesUsageLog,
  NewJulesConfig,
  NewJulesSession,
  NewJulesUsageLog,
} from '../types';

/**
 * Repository for Jules integration, providing data access for all Jules-related entities.
 */
export class DrizzleJulesRepository {
  // ==========================================================================
  // Config Operations
  // ==========================================================================

  /**
   * Get a Jules configuration for a specific tenant.
   * @param tenantId - The ID of the tenant.
   * @returns The Jules configuration, or null if not found.
   */
  async getConfig(tenantId: string): Promise<JulesConfig | null> {
    const [config] = await db
      .select()
      .from(julesConfigs)
      .where(eq(julesConfigs.tenantId, tenantId));
    return config ?? null;
  }

  /**
   * Create or update a Jules configuration for a tenant.
   * @param tenantId - The ID of the tenant.
   * @param config - The configuration data.
   * @returns The created or updated configuration.
   */
  async setConfig(tenantId: string, config: Partial<NewJulesConfig>): Promise<JulesConfig> {
    const [existing] = await db
      .select()
      .from(julesConfigs)
      .where(eq(julesConfigs.tenantId, tenantId));

    if (existing) {
      const [updated] = await db
        .update(julesConfigs)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(julesConfigs.tenantId, tenantId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(julesConfigs)
      .values({ ...config, tenantId })
      .returning();
    return created;
  }

  /**
   * Delete a Jules configuration for a tenant.
   * @param tenantId - The ID of the tenant.
   * @returns True if the deletion was successful, false otherwise.
   */
  async deleteConfig(tenantId: string): Promise<boolean> {
    const result = await db
      .delete(julesConfigs)
      .where(eq(julesConfigs.tenantId, tenantId))
      .returning();
    return result.length > 0;
  }

  // ==========================================================================
  // Session Operations
  // ==========================================================================

  /**
   * Create a new Jules session.
   * @param session - The session data to create.
   * @returns The newly created session.
   */
  async createSession(session: NewJulesSession): Promise<JulesSession> {
    const [newSession] = await db.insert(julesSessions).values(session).returning();
    return newSession;
  }

  /**
   * Get a session by its Jules-specific session ID.
   * @param julesSessionId - The session ID from the Jules API.
   * @returns The session, or null if not found.
   */
  async getSessionByJulesId(julesSessionId: string): Promise<JulesSession | null> {
    const [session] = await db
      .select()
      .from(julesSessions)
      .where(eq(julesSessions.julesSessionId, julesSessionId));
    return session ?? null;
  }

  /**
   * Get a session by its associated TNF task ID.
   * @param taskId - The ID of the task.
   * @returns The session, or null if not found.
   */
  async getSessionByTaskId(taskId: string): Promise<JulesSession | null> {
    const [session] = await db
      .select()
      .from(julesSessions)
      .where(eq(julesSessions.taskId, taskId));
    return session ?? null;
  }

  /**
   * Update the status of a Jules session.
   * @param id - The UUID of the session.
   * @param status - The new status.
   * @returns The updated session, or null if not found.
   */
  async updateSessionStatus(
    id: string,
    status: JulesSession['status']
  ): Promise<JulesSession | null> {
    const [updatedSession] = await db
      .update(julesSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(julesSessions.id, id))
      .returning();
    return updatedSession ?? null;
  }

  /**
   * List all sessions for a specific tenant.
   * @param tenantId - The ID of the tenant.
   * @returns An array of sessions.
   */
  async listSessionsByTenant(tenantId: string): Promise<JulesSession[]> {
    return db.select().from(julesSessions).where(eq(julesSessions.tenantId, tenantId));
  }

  // ==========================================================================
  // Usage Operations
  // ==========================================================================

  /**
   * Log the start of a billable Jules session.
   * @param log - The initial usage log data.
   * @returns The created usage log entry.
   */
  async logUsageStart(log: NewJulesUsageLog): Promise<JulesUsageLog> {
    const [usageLog] = await db.insert(julesUsageLogs).values(log).returning();
    return usageLog;
  }

  /**
   * Log the completion of a billable Jules session.
   * @param julesSessionId - The Jules session ID to mark as complete.
   * @param endData - The data for the completed session.
   * @returns The updated usage log, or null if not found.
   */
  async logUsageEnd(
    julesSessionId: string,
    endData: {
      completedAt: Date;
      durationMinutes: number;
      billableAmount: string;
      metadata?: any;
    }
  ): Promise<JulesUsageLog | null> {
    const [updatedLog] = await db
      .update(julesUsageLogs)
      .set({ ...endData, completedAt: new Date() })
      .where(eq(julesUsageLogs.julesSessionId, julesSessionId))
      .returning();
    return updatedLog ?? null;
  }

  /**
   * Get all usage logs for a tenant, optionally within a date range.
   * @param tenantId - The ID of the tenant.
   * @param dateRange - An object with optional 'from' and 'to' dates.
   * @returns An array of usage logs.
   */
  async getUsageByTenant(
    tenantId: string,
    dateRange?: { from?: Date; to?: Date }
  ): Promise<JulesUsageLog[]> {
    const conditions = [eq(julesUsageLogs.tenantId, tenantId)];
    if (dateRange?.from) {
      conditions.push(gte(julesUsageLogs.createdAt, dateRange.from));
    }
    if (dateRange?.to) {
      conditions.push(lte(julesUsageLogs.createdAt, dateRange.to));
    }
    return db.select().from(julesUsageLogs).where(and(...conditions));
  }
}

export const drizzleJulesRepository = new DrizzleJulesRepository();
