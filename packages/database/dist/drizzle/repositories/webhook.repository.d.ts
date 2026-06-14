import { aiInsights, businessAnalytics, businessEvents, sseSubscriptions, webhookConfigurations, webhookDeliveryLogs } from '../schema.js';
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
export declare class DrizzleWebhookRepository {
    /**
     * Create a new webhook configuration
     */
    createWebhookConfiguration(data: NewWebhookConfiguration): Promise<WebhookConfiguration>;
    /**
     * Find webhook configuration by ID
     */
    findWebhookConfigurationById(id: string): Promise<WebhookConfiguration | null>;
    /**
     * Find webhook configuration by source and organization
     */
    findWebhookConfigurationBySource(source: string, organizationId: string, activeOnly?: boolean): Promise<WebhookConfiguration | null>;
    /**
     * Find all webhook configurations for an organization
     */
    findWebhookConfigurationsByOrganization(organizationId: string): Promise<WebhookConfiguration[]>;
    /**
     * Find active webhook configuration by source
     */
    findActiveWebhookBySource(source: string): Promise<WebhookConfiguration | null>;
    /**
     * Update webhook configuration
     */
    updateWebhookConfiguration(id: string, data: Partial<NewWebhookConfiguration>): Promise<WebhookConfiguration | null>;
    /**
     * Delete webhook configuration
     */
    deleteWebhookConfiguration(id: string): Promise<boolean>;
    /**
     * Count webhook configurations
     */
    countWebhookConfigurations(organizationId: string, activeOnly?: boolean): Promise<number>;
    /**
     * Create a new business event
     */
    createBusinessEvent(data: NewBusinessEvent): Promise<BusinessEvent>;
    /**
     * Find business event by ID
     */
    findBusinessEventById(id: string): Promise<BusinessEvent | null>;
    /**
     * Find business events by organization
     */
    findBusinessEventsByOrganization(organizationId: string, limit?: number): Promise<BusinessEvent[]>;
    /**
     * Find business events by type
     */
    findBusinessEventsByType(type: string, organizationId: string): Promise<BusinessEvent[]>;
    /**
     * Find business events by processing status
     */
    findBusinessEventsByStatus(status: string, limit?: number): Promise<BusinessEvent[]>;
    /**
     * Update business event
     */
    updateBusinessEvent(id: string, data: Partial<NewBusinessEvent>): Promise<BusinessEvent | null>;
    /**
     * Update business event status
     */
    updateBusinessEventStatus(id: string, status: string, processedAt?: Date): Promise<BusinessEvent | null>;
    /**
     * Increment retry count
     */
    incrementRetryCount(id: string): Promise<BusinessEvent | null>;
    /**
     * Count business events
     */
    countBusinessEvents(organizationId: string, status?: string): Promise<number>;
    /**
     * Find last event for organization
     */
    findLastEventByOrganization(organizationId: string): Promise<BusinessEvent | null>;
    /**
     * Create SSE subscription
     */
    createSseSubscription(data: NewSseSubscription): Promise<SseSubscription>;
    /**
     * Find SSE subscriptions by organization
     */
    findSseSubscriptionsByOrganization(organizationId: string): Promise<SseSubscription[]>;
    /**
     * Update SSE subscription
     */
    updateSseSubscription(id: string, data: Partial<NewSseSubscription>): Promise<SseSubscription | null>;
    /**
     * Delete SSE subscription
     */
    deleteSseSubscription(id: string): Promise<boolean>;
    /**
     * Create webhook delivery log
     */
    createDeliveryLog(data: NewWebhookDeliveryLog): Promise<WebhookDeliveryLog>;
    /**
     * Find delivery logs by webhook configuration
     */
    findDeliveryLogsByWebhookId(webhookConfigurationId: string, limit?: number): Promise<WebhookDeliveryLog[]>;
    /**
     * Update delivery log
     */
    updateDeliveryLog(id: string, data: Partial<NewWebhookDeliveryLog>): Promise<WebhookDeliveryLog | null>;
    /**
     * Create or update business analytic
     */
    upsertBusinessAnalytic(data: NewBusinessAnalytic): Promise<BusinessAnalytic>;
    /**
     * Find analytics by organization
     */
    findAnalyticsByOrganization(organizationId: string, metricType?: string): Promise<BusinessAnalytic[]>;
    /**
     * Create AI insight
     */
    createAiInsight(data: NewAiInsight): Promise<AiInsight>;
    /**
     * Find AI insights by organization
     */
    findAiInsightsByOrganization(organizationId: string, acknowledgedFilter?: boolean): Promise<AiInsight[]>;
    /**
     * Acknowledge AI insight
     */
    acknowledgeAiInsight(id: string, userId: string): Promise<AiInsight | null>;
}
export declare const drizzleWebhookRepository: DrizzleWebhookRepository;
//# sourceMappingURL=webhook.repository.d.ts.map