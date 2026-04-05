"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWebhookRepository = exports.DrizzleWebhookRepository = void 0;
/**
 * Webhook Repository - Drizzle ORM Implementation
 * Provides data access for webhook configurations and business events
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Webhook Repository - provides data access for Webhook entities
 */
class DrizzleWebhookRepository {
    // ==========================================================================
    // WEBHOOK CONFIGURATIONS
    // ==========================================================================
    /**
     * Create a new webhook configuration
     */
    async createWebhookConfiguration(data) {
        const [config] = await client_1.db.insert(schema_1.webhookConfigurations).values(data).returning();
        return config;
    }
    /**
     * Find webhook configuration by ID
     */
    async findWebhookConfigurationById(id) {
        const [config] = await client_1.db
            .select()
            .from(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.id, id));
        return config ?? null;
    }
    /**
     * Find webhook configuration by source and organization
     */
    async findWebhookConfigurationBySource(source, organizationId, activeOnly = true) {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.source, source),
            (0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.organizationId, organizationId),
        ];
        if (activeOnly) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.isActive, true));
        }
        const [config] = await client_1.db
            .select()
            .from(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.and)(...conditions));
        return config ?? null;
    }
    /**
     * Find all webhook configurations for an organization
     */
    async findWebhookConfigurationsByOrganization(organizationId) {
        return client_1.db
            .select()
            .from(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.organizationId, organizationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.webhookConfigurations.createdAt));
    }
    /**
     * Find active webhook configuration by source
     */
    async findActiveWebhookBySource(source) {
        const [config] = await client_1.db
            .select()
            .from(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.source, source), (0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.isActive, true)));
        return config ?? null;
    }
    /**
     * Update webhook configuration
     */
    async updateWebhookConfiguration(id, data) {
        const [config] = await client_1.db
            .update(schema_1.webhookConfigurations)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.id, id))
            .returning();
        return config ?? null;
    }
    /**
     * Delete webhook configuration
     */
    async deleteWebhookConfiguration(id) {
        const result = await client_1.db
            .delete(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Count webhook configurations
     */
    async countWebhookConfigurations(organizationId, activeOnly = false) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.organizationId, organizationId)];
        if (activeOnly) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.webhookConfigurations.isActive, true));
        }
        const result = await client_1.db
            .select({ count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)` })
            .from(schema_1.webhookConfigurations)
            .where((0, drizzle_orm_1.and)(...conditions));
        return result[0]?.count ?? 0;
    }
    // ==========================================================================
    // BUSINESS EVENTS
    // ==========================================================================
    /**
     * Create a new business event
     */
    async createBusinessEvent(data) {
        const [event] = await client_1.db.insert(schema_1.businessEvents).values(data).returning();
        return event;
    }
    /**
     * Find business event by ID
     */
    async findBusinessEventById(id) {
        const [event] = await client_1.db.select().from(schema_1.businessEvents).where((0, drizzle_orm_1.eq)(schema_1.businessEvents.id, id));
        return event ?? null;
    }
    /**
     * Find business events by organization
     */
    async findBusinessEventsByOrganization(organizationId, limit = 100) {
        return client_1.db
            .select()
            .from(schema_1.businessEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.organizationId, organizationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.businessEvents.createdAt))
            .limit(limit);
    }
    /**
     * Find business events by type
     */
    async findBusinessEventsByType(type, organizationId) {
        return client_1.db
            .select()
            .from(schema_1.businessEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.businessEvents.type, type), (0, drizzle_orm_1.eq)(schema_1.businessEvents.organizationId, organizationId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.businessEvents.createdAt));
    }
    /**
     * Find business events by processing status
     */
    async findBusinessEventsByStatus(status, limit = 100) {
        return client_1.db
            .select()
            .from(schema_1.businessEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.processingStatus, status))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.businessEvents.createdAt))
            .limit(limit);
    }
    /**
     * Update business event
     */
    async updateBusinessEvent(id, data) {
        const [event] = await client_1.db
            .update(schema_1.businessEvents)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.id, id))
            .returning();
        return event ?? null;
    }
    /**
     * Update business event status
     */
    async updateBusinessEventStatus(id, status, processedAt) {
        const [event] = await client_1.db
            .update(schema_1.businessEvents)
            .set({
            processingStatus: status,
            processedAt: processedAt || (status === 'completed' ? new Date() : undefined),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.id, id))
            .returning();
        return event ?? null;
    }
    /**
     * Increment retry count
     */
    async incrementRetryCount(id) {
        const [event] = await client_1.db
            .update(schema_1.businessEvents)
            .set({
            retryCount: (0, drizzle_orm_1.sql) `${schema_1.businessEvents.retryCount} + 1`,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.id, id))
            .returning();
        return event ?? null;
    }
    /**
     * Count business events
     */
    async countBusinessEvents(organizationId, status) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.businessEvents.organizationId, organizationId)];
        if (status) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.businessEvents.processingStatus, status));
        }
        const result = await client_1.db
            .select({ count: (0, drizzle_orm_1.sql) `cast(count(*) as integer)` })
            .from(schema_1.businessEvents)
            .where((0, drizzle_orm_1.and)(...conditions));
        return result[0]?.count ?? 0;
    }
    /**
     * Find last event for organization
     */
    async findLastEventByOrganization(organizationId) {
        const [event] = await client_1.db
            .select()
            .from(schema_1.businessEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.businessEvents.organizationId, organizationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.businessEvents.createdAt))
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
        const [sub] = await client_1.db.insert(schema_1.sseSubscriptions).values(data).returning();
        return sub;
    }
    /**
     * Find SSE subscriptions by organization
     */
    async findSseSubscriptionsByOrganization(organizationId) {
        return client_1.db
            .select()
            .from(schema_1.sseSubscriptions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sseSubscriptions.organizationId, organizationId), (0, drizzle_orm_1.eq)(schema_1.sseSubscriptions.isActive, true)));
    }
    /**
     * Update SSE subscription
     */
    async updateSseSubscription(id, data) {
        const [sub] = await client_1.db
            .update(schema_1.sseSubscriptions)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.sseSubscriptions.id, id))
            .returning();
        return sub ?? null;
    }
    /**
     * Delete SSE subscription
     */
    async deleteSseSubscription(id) {
        const result = await client_1.db.delete(schema_1.sseSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.sseSubscriptions.id, id)).returning();
        return result.length > 0;
    }
    // ==========================================================================
    // WEBHOOK DELIVERY LOGS
    // ==========================================================================
    /**
     * Create webhook delivery log
     */
    async createDeliveryLog(data) {
        const [log] = await client_1.db.insert(schema_1.webhookDeliveryLogs).values(data).returning();
        return log;
    }
    /**
     * Find delivery logs by webhook configuration
     */
    async findDeliveryLogsByWebhookId(webhookConfigurationId, limit = 50) {
        return client_1.db
            .select()
            .from(schema_1.webhookDeliveryLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.webhookDeliveryLogs.webhookConfigurationId, webhookConfigurationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.webhookDeliveryLogs.createdAt))
            .limit(limit);
    }
    /**
     * Update delivery log
     */
    async updateDeliveryLog(id, data) {
        const [log] = await client_1.db
            .update(schema_1.webhookDeliveryLogs)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.webhookDeliveryLogs.id, id))
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
        const [analytic] = await client_1.db
            .insert(schema_1.businessAnalytics)
            .values(data)
            .onConflictDoUpdate({
            target: [schema_1.businessAnalytics.id],
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
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.businessAnalytics.organizationId, organizationId)];
        if (metricType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.businessAnalytics.metricType, metricType));
        }
        return client_1.db
            .select()
            .from(schema_1.businessAnalytics)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.businessAnalytics.periodEnd));
    }
    // ==========================================================================
    // AI INSIGHTS
    // ==========================================================================
    /**
     * Create AI insight
     */
    async createAiInsight(data) {
        const [insight] = await client_1.db.insert(schema_1.aiInsights).values(data).returning();
        return insight;
    }
    /**
     * Find AI insights by organization
     */
    async findAiInsightsByOrganization(organizationId, acknowledgedFilter) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.aiInsights.organizationId, organizationId)];
        if (acknowledgedFilter !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.aiInsights.isAcknowledged, acknowledgedFilter));
        }
        return client_1.db
            .select()
            .from(schema_1.aiInsights)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.aiInsights.createdAt));
    }
    /**
     * Acknowledge AI insight
     */
    async acknowledgeAiInsight(id, userId) {
        const [insight] = await client_1.db
            .update(schema_1.aiInsights)
            .set({
            isAcknowledged: true,
            acknowledgedAt: new Date(),
            acknowledgedById: userId,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.aiInsights.id, id))
            .returning();
        return insight ?? null;
    }
}
exports.DrizzleWebhookRepository = DrizzleWebhookRepository;
// Export singleton instance
exports.drizzleWebhookRepository = new DrizzleWebhookRepository();
//# sourceMappingURL=webhook.repository.js.map