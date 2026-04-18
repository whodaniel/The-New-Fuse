/**
 * Drizzle ORM Schema - Webhooks
 * Manages webhook configurations and business events for integration processing
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

// =============================================================================
// WEBHOOK CONFIGURATIONS
// Stores webhook endpoint configurations for various integration sources
// =============================================================================

export const webhookConfigurations = pgTable('webhook_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  endpointUrl: varchar('endpoint_url', { length: 500 }).notNull(),
  secretKey: varchar('secret_key', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  configuration: jsonb('configuration').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// BUSINESS EVENTS
// Stores incoming business events from various integration sources
// =============================================================================

export const businessEvents = pgTable(
  'business_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(),
    source: varchar('source', { length: 50 }).notNull(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    correlationId: varchar('correlation_id', { length: 255 }),
    data: jsonb('data').default({}).notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    processingStatus: varchar('processing_status', { length: 20 }).default('pending').notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    orgTypeIdx: index('idx_business_events_org_type').on(table.organizationId, table.type),
    statusIdx: index('idx_business_events_status').on(table.processingStatus),
    createdIdx: index('idx_business_events_created').on(table.createdAt),
    correlationIdx: index('idx_business_events_correlation').on(table.correlationId),
  })
);

// =============================================================================
// SSE SUBSCRIPTIONS
// Server-Sent Events subscriptions for real-time event streaming
// =============================================================================

export const sseSubscriptions = pgTable('sse_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  eventTypes: jsonb('event_types').default([]).notNull(),
  filters: jsonb('filters').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// =============================================================================
// WEBHOOK DELIVERY LOGS
// Logs of webhook delivery attempts for debugging and retry purposes
// =============================================================================

export const webhookDeliveryLogs = pgTable(
  'webhook_delivery_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webhookConfigurationId: uuid('webhook_configuration_id')
      .references(() => webhookConfigurations.id, { onDelete: 'cascade' })
      .notNull(),
    eventId: uuid('event_id').references(() => businessEvents.id, { onDelete: 'set null' }),
    payload: jsonb('payload').default({}).notNull(),
    responseStatus: integer('response_status'),
    responseBody: varchar('response_body', { length: 2000 }),
    deliveryStatus: varchar('delivery_status', { length: 20 }).default('pending').notNull(),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    webhookIdIdx: index('idx_webhook_delivery_webhook_id').on(table.webhookConfigurationId),
    statusIdx: index('idx_webhook_delivery_status').on(table.deliveryStatus),
  })
);

// =============================================================================
// BUSINESS ANALYTICS
// Aggregated analytics data from business events
// =============================================================================

export const businessAnalytics = pgTable(
  'business_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    metricType: varchar('metric_type', { length: 50 }).notNull(),
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    metricValue: jsonb('metric_value').default({}).notNull(),
    dimensions: jsonb('dimensions').default({}).notNull(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgMetricIdx: index('idx_business_analytics_org_metric').on(
      table.organizationId,
      table.metricType
    ),
    periodIdx: index('idx_business_analytics_period').on(table.periodStart, table.periodEnd),
  })
);

// =============================================================================
// AI INSIGHTS
// AI-generated insights based on business events and analytics
// =============================================================================

export const aiInsights = pgTable(
  'ai_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    insightType: varchar('insight_type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: varchar('description', { length: 2000 }),
    severity: varchar('severity', { length: 20 }).default('info').notNull(),
    data: jsonb('data').default({}).notNull(),
    recommendations: jsonb('recommendations').default([]).notNull(),
    isAcknowledged: boolean('is_acknowledged').default(false).notNull(),
    acknowledgedAt: timestamp('acknowledged_at'),
    acknowledgedById: uuid('acknowledged_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgTypeIdx: index('idx_ai_insights_org_type').on(table.organizationId, table.insightType),
    severityIdx: index('idx_ai_insights_severity').on(table.severity),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const businessEventsRelations = relations(businessEvents, ({ one }) => ({
  user: one(users, {
    fields: [businessEvents.userId],
    references: [users.id],
  }),
}));

export const sseSubscriptionsRelations = relations(sseSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [sseSubscriptions.userId],
    references: [users.id],
  }),
}));

export const webhookDeliveryLogsRelations = relations(webhookDeliveryLogs, ({ one }) => ({
  webhookConfiguration: one(webhookConfigurations, {
    fields: [webhookDeliveryLogs.webhookConfigurationId],
    references: [webhookConfigurations.id],
  }),
  event: one(businessEvents, {
    fields: [webhookDeliveryLogs.eventId],
    references: [businessEvents.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  acknowledgedBy: one(users, {
    fields: [aiInsights.acknowledgedById],
    references: [users.id],
  }),
}));
