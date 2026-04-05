"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiInsightsRelations = exports.webhookDeliveryLogsRelations = exports.sseSubscriptionsRelations = exports.businessEventsRelations = exports.aiInsights = exports.businessAnalytics = exports.webhookDeliveryLogs = exports.sseSubscriptions = exports.businessEvents = exports.webhookConfigurations = void 0;
/**
 * Drizzle ORM Schema - Webhooks
 * Manages webhook configurations and business events for integration processing
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// WEBHOOK CONFIGURATIONS
// Stores webhook endpoint configurations for various integration sources
// =============================================================================
exports.webhookConfigurations = (0, pg_core_1.pgTable)('webhook_configurations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    organizationId: (0, pg_core_1.uuid)('organization_id').notNull(),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull(),
    endpointUrl: (0, pg_core_1.varchar)('endpoint_url', { length: 500 }).notNull(),
    secretKey: (0, pg_core_1.varchar)('secret_key', { length: 255 }).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    configuration: (0, pg_core_1.jsonb)('configuration').default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// BUSINESS EVENTS
// Stores incoming business events from various integration sources
// =============================================================================
exports.businessEvents = (0, pg_core_1.pgTable)('business_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    source: (0, pg_core_1.varchar)('source', { length: 50 }).notNull(),
    organizationId: (0, pg_core_1.uuid)('organization_id').notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    correlationId: (0, pg_core_1.varchar)('correlation_id', { length: 255 }),
    data: (0, pg_core_1.jsonb)('data').default({}).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}).notNull(),
    processingStatus: (0, pg_core_1.varchar)('processing_status', { length: 20 }).default('pending').notNull(),
    retryCount: (0, pg_core_1.integer)('retry_count').default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
}, (table) => ({
    orgTypeIdx: (0, pg_core_1.index)('idx_business_events_org_type').on(table.organizationId, table.type),
    statusIdx: (0, pg_core_1.index)('idx_business_events_status').on(table.processingStatus),
    createdIdx: (0, pg_core_1.index)('idx_business_events_created').on(table.createdAt),
    correlationIdx: (0, pg_core_1.index)('idx_business_events_correlation').on(table.correlationId),
}));
// =============================================================================
// SSE SUBSCRIPTIONS
// Server-Sent Events subscriptions for real-time event streaming
// =============================================================================
exports.sseSubscriptions = (0, pg_core_1.pgTable)('sse_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    organizationId: (0, pg_core_1.uuid)('organization_id').notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'cascade' }),
    eventTypes: (0, pg_core_1.jsonb)('event_types').default([]).notNull(),
    filters: (0, pg_core_1.jsonb)('filters').default({}).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
});
// =============================================================================
// WEBHOOK DELIVERY LOGS
// Logs of webhook delivery attempts for debugging and retry purposes
// =============================================================================
exports.webhookDeliveryLogs = (0, pg_core_1.pgTable)('webhook_delivery_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    webhookConfigurationId: (0, pg_core_1.uuid)('webhook_configuration_id')
        .references(() => exports.webhookConfigurations.id, { onDelete: 'cascade' })
        .notNull(),
    eventId: (0, pg_core_1.uuid)('event_id').references(() => exports.businessEvents.id, { onDelete: 'set null' }),
    payload: (0, pg_core_1.jsonb)('payload').default({}).notNull(),
    responseStatus: (0, pg_core_1.integer)('response_status'),
    responseBody: (0, pg_core_1.varchar)('response_body', { length: 2000 }),
    deliveryStatus: (0, pg_core_1.varchar)('delivery_status', { length: 20 }).default('pending').notNull(),
    attemptNumber: (0, pg_core_1.integer)('attempt_number').default(1).notNull(),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    webhookIdIdx: (0, pg_core_1.index)('idx_webhook_delivery_webhook_id').on(table.webhookConfigurationId),
    statusIdx: (0, pg_core_1.index)('idx_webhook_delivery_status').on(table.deliveryStatus),
}));
// =============================================================================
// BUSINESS ANALYTICS
// Aggregated analytics data from business events
// =============================================================================
exports.businessAnalytics = (0, pg_core_1.pgTable)('business_analytics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    organizationId: (0, pg_core_1.uuid)('organization_id').notNull(),
    metricType: (0, pg_core_1.varchar)('metric_type', { length: 50 }).notNull(),
    metricName: (0, pg_core_1.varchar)('metric_name', { length: 100 }).notNull(),
    metricValue: (0, pg_core_1.jsonb)('metric_value').default({}).notNull(),
    dimensions: (0, pg_core_1.jsonb)('dimensions').default({}).notNull(),
    periodStart: (0, pg_core_1.timestamp)('period_start').notNull(),
    periodEnd: (0, pg_core_1.timestamp)('period_end').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgMetricIdx: (0, pg_core_1.index)('idx_business_analytics_org_metric').on(table.organizationId, table.metricType),
    periodIdx: (0, pg_core_1.index)('idx_business_analytics_period').on(table.periodStart, table.periodEnd),
}));
// =============================================================================
// AI INSIGHTS
// AI-generated insights based on business events and analytics
// =============================================================================
exports.aiInsights = (0, pg_core_1.pgTable)('ai_insights', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    organizationId: (0, pg_core_1.uuid)('organization_id').notNull(),
    insightType: (0, pg_core_1.varchar)('insight_type', { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)('description', { length: 2000 }),
    severity: (0, pg_core_1.varchar)('severity', { length: 20 }).default('info').notNull(),
    data: (0, pg_core_1.jsonb)('data').default({}).notNull(),
    recommendations: (0, pg_core_1.jsonb)('recommendations').default([]).notNull(),
    isAcknowledged: (0, pg_core_1.boolean)('is_acknowledged').default(false).notNull(),
    acknowledgedAt: (0, pg_core_1.timestamp)('acknowledged_at'),
    acknowledgedById: (0, pg_core_1.uuid)('acknowledged_by_id').references(() => users_1.users.id, {
        onDelete: 'set null',
    }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgTypeIdx: (0, pg_core_1.index)('idx_ai_insights_org_type').on(table.organizationId, table.insightType),
    severityIdx: (0, pg_core_1.index)('idx_ai_insights_severity').on(table.severity),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.businessEventsRelations = (0, drizzle_orm_1.relations)(exports.businessEvents, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.businessEvents.userId],
        references: [users_1.users.id],
    }),
}));
exports.sseSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.sseSubscriptions, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.sseSubscriptions.userId],
        references: [users_1.users.id],
    }),
}));
exports.webhookDeliveryLogsRelations = (0, drizzle_orm_1.relations)(exports.webhookDeliveryLogs, ({ one }) => ({
    webhookConfiguration: one(exports.webhookConfigurations, {
        fields: [exports.webhookDeliveryLogs.webhookConfigurationId],
        references: [exports.webhookConfigurations.id],
    }),
    event: one(exports.businessEvents, {
        fields: [exports.webhookDeliveryLogs.eventId],
        references: [exports.businessEvents.id],
    }),
}));
exports.aiInsightsRelations = (0, drizzle_orm_1.relations)(exports.aiInsights, ({ one }) => ({
    acknowledgedBy: one(users_1.users, {
        fields: [exports.aiInsights.acknowledgedById],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=webhooks.js.map