/**
 * Webhook Repository - Drizzle ORM Implementation
 * Provides data access for webhook configurations and business events
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { aiInsights, businessAnalytics, businessEvents, sseSubscriptions, webhookConfigurations, webhookDeliveryLogs, } from '../schema.js';
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
    async createWebhookConfiguration(data) {
        const [config] = await db.insert(webhookConfigurations).values(data).returning();
        return config;
    }
    /**
     * Find webhook configuration by ID
     */
    async findWebhookConfigurationById(id) {
        const [config] = await db
            .select()
            .from(webhookConfigurations)
            .where(eq(webhookConfigurations.id, id));
        return config ?? null;
    }
    /**
     * Find webhook configuration by source and organization
     */
    async findWebhookConfigurationBySource(source, organizationId, activeOnly = true) {
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
    async findWebhookConfigurationsByOrganization(organizationId) {
        return db
            .select()
            .from(webhookConfigurations)
            .where(eq(webhookConfigurations.organizationId, organizationId))
            .orderBy(desc(webhookConfigurations.createdAt));
    }
    /**
     * Find active webhook configuration by source
     */
    async findActiveWebhookBySource(source) {
        const [config] = await db
            .select()
            .from(webhookConfigurations)
            .where(and(eq(webhookConfigurations.source, source), eq(webhookConfigurations.isActive, true)));
        return config ?? null;
    }
    /**
     * Update webhook configuration
     */
    async updateWebhookConfiguration(id, data) {
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
    async deleteWebhookConfiguration(id) {
        const result = await db
            .delete(webhookConfigurations)
            .where(eq(webhookConfigurations.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Count webhook configurations
     */
    async countWebhookConfigurations(organizationId, activeOnly = false) {
        const conditions = [eq(webhookConfigurations.organizationId, organizationId)];
        if (activeOnly) {
            conditions.push(eq(webhookConfigurations.isActive, true));
        }
        const result = await db
            .select({ count: sql `cast(count(*) as integer)` })
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
    async createBusinessEvent(data) {
        const [event] = await db.insert(businessEvents).values(data).returning();
        return event;
    }
    /**
     * Find business event by ID
     */
    async findBusinessEventById(id) {
        const [event] = await db.select().from(businessEvents).where(eq(businessEvents.id, id));
        return event ?? null;
    }
    /**
     * Find business events by organization
     */
    async findBusinessEventsByOrganization(organizationId, limit = 100) {
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
    async findBusinessEventsByType(type, organizationId) {
        return db
            .select()
            .from(businessEvents)
            .where(and(eq(businessEvents.type, type), eq(businessEvents.organizationId, organizationId)))
            .orderBy(desc(businessEvents.createdAt));
    }
    /**
     * Find business events by processing status
     */
    async findBusinessEventsByStatus(status, limit = 100) {
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
    async updateBusinessEvent(id, data) {
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
    async updateBusinessEventStatus(id, status, processedAt) {
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
    async incrementRetryCount(id) {
        const [event] = await db
            .update(businessEvents)
            .set({
            retryCount: sql `${businessEvents.retryCount} + 1`,
            updatedAt: new Date(),
        })
            .where(eq(businessEvents.id, id))
            .returning();
        return event ?? null;
    }
    /**
     * Count business events
     */
    async countBusinessEvents(organizationId, status) {
        const conditions = [eq(businessEvents.organizationId, organizationId)];
        if (status) {
            conditions.push(eq(businessEvents.processingStatus, status));
        }
        const result = await db
            .select({ count: sql `cast(count(*) as integer)` })
            .from(businessEvents)
            .where(and(...conditions));
        return result[0]?.count ?? 0;
    }
    /**
     * Find last event for organization
     */
    async findLastEventByOrganization(organizationId) {
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
    async createSseSubscription(data) {
        const [sub] = await db.insert(sseSubscriptions).values(data).returning();
        return sub;
    }
    /**
     * Find SSE subscriptions by organization
     */
    async findSseSubscriptionsByOrganization(organizationId) {
        return db
            .select()
            .from(sseSubscriptions)
            .where(and(eq(sseSubscriptions.organizationId, organizationId), eq(sseSubscriptions.isActive, true)));
    }
    /**
     * Update SSE subscription
     */
    async updateSseSubscription(id, data) {
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
    async deleteSseSubscription(id) {
        const result = await db.delete(sseSubscriptions).where(eq(sseSubscriptions.id, id)).returning();
        return result.length > 0;
    }
    // ==========================================================================
    // WEBHOOK DELIVERY LOGS
    // ==========================================================================
    /**
     * Create webhook delivery log
     */
    async createDeliveryLog(data) {
        const [log] = await db.insert(webhookDeliveryLogs).values(data).returning();
        return log;
    }
    /**
     * Find delivery logs by webhook configuration
     */
    async findDeliveryLogsByWebhookId(webhookConfigurationId, limit = 50) {
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
    async updateDeliveryLog(id, data) {
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
    async upsertBusinessAnalytic(data) {
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
    async findAnalyticsByOrganization(organizationId, metricType) {
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
    async createAiInsight(data) {
        const [insight] = await db.insert(aiInsights).values(data).returning();
        return insight;
    }
    /**
     * Find AI insights by organization
     */
    async findAiInsightsByOrganization(organizationId, acknowledgedFilter) {
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
    async acknowledgeAiInsight(id, userId) {
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
//# sourceMappingURL=webhook.repository.js.map