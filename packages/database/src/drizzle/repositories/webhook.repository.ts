/**
 * Webhook Repository - Drizzle ORM Implementation
 * Provides data access for webhook configurations and business events
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../client.js';
import {
  aiInsights,
  businessAnalytics,
  businessEvents,
  sseSubscriptions,
  webhookConfigurations,
  webhookDeliveryLogs,
} from '../schema/index.js';

// Type definitions for the repository
export type WebhookConfiguration = typeof webhookConfigurations.$inferSelect;
export type NewWebhookConfiguration = typeof webhookConfigurations.$inferInsert;

export type BusinessEvent = typeof businessEvents.$inferSelect;
export type NewBusinessEvent = typeof businessEvents.$inferInsert;

export type SseSubscription = typeof sseSubscriptions.$inferSelect;
export type NewSseSubscription = typeof sseSubscriptions.$inferInsert;

export type WebhookDeliveryLog = typeof webhookDeliveryLogs.$inferSelect;
export type NewWebhookDeliveryLog = typeof webhookDeliveryLogs.$inferInsert;

export type BusinessAnalytic = typeof businessAnalytics.$inferSelect;
export type NewBusinessAnalytic = typeof businessAnalytics.$inferInsert;

export type AiInsight = typeof aiInsights.$inferSelect;
export type NewAiInsight = typeof aiInsights.$inferInsert;

/**
 * Webhook Repository - provides data access for Webhook entities
 */
export class DrizzleWebhookRepository {
  // ==========================================================================
  // WEBHOOK CONFIGURATIONS
  // ==========================================================================

  /**
   * Create a new webhook configuration
   */
  async createWebhookConfiguration(data: NewWebhookConfiguration): Promise<WebhookConfiguration> {
    const [config] = await db.insert(webhookConfigurations).values(data).returning();
    return config;
  }

  /**
   * Find webhook configuration by ID
   */
  async findWebhookConfigurationById(id: string): Promise<WebhookConfiguration | null> {
    const [config] = await db
      .select()
      .from(webhookConfigurations)
      .where(eq(webhookConfigurations.id, id));

    return config ?? null;
  }

  /**
   * Find webhook configuration by source and organization
   */
  async findWebhookConfigurationBySource(
    source: string,
    organizationId: string,
    activeOnly = true
  ): Promise<WebhookConfiguration | null> {
    const conditions = [
      eq(webhookConfigurations.source, source),
      eq(webhookConfigurations.organizationId, organizationId),
    ];

    if (activeOnly) {
      conditions.push(eq(webhookConfigurations.isActive, true));
    }

    const [config] = await db
      .select()
      .from(webhookConfigurations)
      .where(and(...conditions));

    return config ?? null;
  }

  /**
   * Find all webhook configurations for an organization
   */
  async findWebhookConfigurationsByOrganization(
    organizationId: string
  ): Promise<WebhookConfiguration[]> {
    return db
      .select()
      .from(webhookConfigurations)
      .where(eq(webhookConfigurations.organizationId, organizationId))
      .orderBy(desc(webhookConfigurations.createdAt));
  }

  /**
   * Find active webhook configuration by source
   */
  async findActiveWebhookBySource(source: string): Promise<WebhookConfiguration | null> {
    const [config] = await db
      .select()
      .from(webhookConfigurations)
      .where(
        and(eq(webhookConfigurations.source, source), eq(webhookConfigurations.isActive, true))
      );

    return config ?? null;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhookConfiguration(
    id: string,
    data: Partial<NewWebhookConfiguration>
  ): Promise<WebhookConfiguration | null> {
    const [config] = await db
      .update(webhookConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(webhookConfigurations.id, id))
      .returning();

    return config ?? null;
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhookConfiguration(id: string): Promise<boolean> {
    const result = await db
      .delete(webhookConfigurations)
      .where(eq(webhookConfigurations.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Count webhook configurations
   */
  async countWebhookConfigurations(organizationId: string, activeOnly = false): Promise<number> {
    const conditions = [eq(webhookConfigurations.organizationId, organizationId)];
    if (activeOnly) {
      conditions.push(eq(webhookConfigurations.isActive, true));
    }

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(webhookConfigurations)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  // ==========================================================================
  // BUSINESS EVENTS
  // ==========================================================================

  /**
   * Create a new business event
   */
  async createBusinessEvent(data: NewBusinessEvent): Promise<BusinessEvent> {
    const [event] = await db.insert(businessEvents).values(data).returning();
    return event;
  }

  /**
   * Find business event by ID
   */
  async findBusinessEventById(id: string): Promise<BusinessEvent | null> {
    const [event] = await db.select().from(businessEvents).where(eq(businessEvents.id, id));
    return event ?? null;
  }

  /**
   * Find business events by organization
   */
  async findBusinessEventsByOrganization(
    organizationId: string,
    limit = 100
  ): Promise<BusinessEvent[]> {
    return db
      .select()
      .from(businessEvents)
      .where(eq(businessEvents.organizationId, organizationId))
      .orderBy(desc(businessEvents.createdAt))
      .limit(limit);
  }

  /**
   * Find business events by type
   */
  async findBusinessEventsByType(type: string, organizationId: string): Promise<BusinessEvent[]> {
    return db
      .select()
      .from(businessEvents)
      .where(and(eq(businessEvents.type, type), eq(businessEvents.organizationId, organizationId)))
      .orderBy(desc(businessEvents.createdAt));
  }

  /**
   * Find business events by processing status
   */
  async findBusinessEventsByStatus(status: string, limit = 100): Promise<BusinessEvent[]> {
    return db
      .select()
      .from(businessEvents)
      .where(eq(businessEvents.processingStatus, status))
      .orderBy(desc(businessEvents.createdAt))
      .limit(limit);
  }

  /**
   * Update business event
   */
  async updateBusinessEvent(
    id: string,
    data: Partial<NewBusinessEvent>
  ): Promise<BusinessEvent | null> {
    const [event] = await db
      .update(businessEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessEvents.id, id))
      .returning();

    return event ?? null;
  }

  /**
   * Update business event status
   */
  async updateBusinessEventStatus(
    id: string,
    status: string,
    processedAt?: Date
  ): Promise<BusinessEvent | null> {
    const [event] = await db
      .update(businessEvents)
      .set({
        processingStatus: status,
        processedAt: processedAt || (status === 'completed' ? new Date() : undefined),
        updatedAt: new Date(),
      })
      .where(eq(businessEvents.id, id))
      .returning();

    return event ?? null;
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: string): Promise<BusinessEvent | null> {
    const [event] = await db
      .update(businessEvents)
      .set({
        retryCount: sql`${businessEvents.retryCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(businessEvents.id, id))
      .returning();

    return event ?? null;
  }

  /**
   * Count business events
   */
  async countBusinessEvents(organizationId: string, status?: string): Promise<number> {
    const conditions = [eq(businessEvents.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(businessEvents.processingStatus, status));
    }

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(businessEvents)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  /**
   * Find last event for organization
   */
  async findLastEventByOrganization(organizationId: string): Promise<BusinessEvent | null> {
    const [event] = await db
      .select()
      .from(businessEvents)
      .where(eq(businessEvents.organizationId, organizationId))
      .orderBy(desc(businessEvents.createdAt))
      .limit(1);

    return event ?? null;
  }

  // ==========================================================================
  // SSE SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Create SSE subscription
   */
  async createSseSubscription(data: NewSseSubscription): Promise<SseSubscription> {
    const [sub] = await db.insert(sseSubscriptions).values(data).returning();
    return sub;
  }

  /**
   * Find SSE subscriptions by organization
   */
  async findSseSubscriptionsByOrganization(organizationId: string): Promise<SseSubscription[]> {
    return db
      .select()
      .from(sseSubscriptions)
      .where(
        and(
          eq(sseSubscriptions.organizationId, organizationId),
          eq(sseSubscriptions.isActive, true)
        )
      );
  }

  /**
   * Update SSE subscription
   */
  async updateSseSubscription(
    id: string,
    data: Partial<NewSseSubscription>
  ): Promise<SseSubscription | null> {
    const [sub] = await db
      .update(sseSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sseSubscriptions.id, id))
      .returning();

    return sub ?? null;
  }

  /**
   * Delete SSE subscription
   */
  async deleteSseSubscription(id: string): Promise<boolean> {
    const result = await db.delete(sseSubscriptions).where(eq(sseSubscriptions.id, id)).returning();

    return result.length > 0;
  }

  // ==========================================================================
  // WEBHOOK DELIVERY LOGS
  // ==========================================================================

  /**
   * Create webhook delivery log
   */
  async createDeliveryLog(data: NewWebhookDeliveryLog): Promise<WebhookDeliveryLog> {
    const [log] = await db.insert(webhookDeliveryLogs).values(data).returning();
    return log;
  }

  /**
   * Find delivery logs by webhook configuration
   */
  async findDeliveryLogsByWebhookId(
    webhookConfigurationId: string,
    limit = 50
  ): Promise<WebhookDeliveryLog[]> {
    return db
      .select()
      .from(webhookDeliveryLogs)
      .where(eq(webhookDeliveryLogs.webhookConfigurationId, webhookConfigurationId))
      .orderBy(desc(webhookDeliveryLogs.createdAt))
      .limit(limit);
  }

  /**
   * Update delivery log
   */
  async updateDeliveryLog(
    id: string,
    data: Partial<NewWebhookDeliveryLog>
  ): Promise<WebhookDeliveryLog | null> {
    const [log] = await db
      .update(webhookDeliveryLogs)
      .set(data)
      .where(eq(webhookDeliveryLogs.id, id))
      .returning();

    return log ?? null;
  }

  // ==========================================================================
  // BUSINESS ANALYTICS
  // ==========================================================================

  /**
   * Create or update business analytic
   */
  async upsertBusinessAnalytic(data: NewBusinessAnalytic): Promise<BusinessAnalytic> {
    const [analytic] = await db
      .insert(businessAnalytics)
      .values(data)
      .onConflictDoUpdate({
        target: [businessAnalytics.id],
        set: {
          metricValue: data.metricValue,
          updatedAt: new Date(),
        },
      })
      .returning();

    return analytic;
  }

  /**
   * Find analytics by organization
   */
  async findAnalyticsByOrganization(
    organizationId: string,
    metricType?: string
  ): Promise<BusinessAnalytic[]> {
    const conditions = [eq(businessAnalytics.organizationId, organizationId)];
    if (metricType) {
      conditions.push(eq(businessAnalytics.metricType, metricType));
    }

    return db
      .select()
      .from(businessAnalytics)
      .where(and(...conditions))
      .orderBy(desc(businessAnalytics.periodEnd));
  }

  // ==========================================================================
  // AI INSIGHTS
  // ==========================================================================

  /**
   * Create AI insight
   */
  async createAiInsight(data: NewAiInsight): Promise<AiInsight> {
    const [insight] = await db.insert(aiInsights).values(data).returning();
    return insight;
  }

  /**
   * Find AI insights by organization
   */
  async findAiInsightsByOrganization(
    organizationId: string,
    acknowledgedFilter?: boolean
  ): Promise<AiInsight[]> {
    const conditions = [eq(aiInsights.organizationId, organizationId)];
    if (acknowledgedFilter !== undefined) {
      conditions.push(eq(aiInsights.isAcknowledged, acknowledgedFilter));
    }

    return db
      .select()
      .from(aiInsights)
      .where(and(...conditions))
      .orderBy(desc(aiInsights.createdAt));
  }

  /**
   * Acknowledge AI insight
   */
  async acknowledgeAiInsight(id: string, userId: string): Promise<AiInsight | null> {
    const [insight] = await db
      .update(aiInsights)
      .set({
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(aiInsights.id, id))
      .returning();

    return insight ?? null;
  }
}

// Export singleton instance
export const drizzleWebhookRepository = new DrizzleWebhookRepository();
