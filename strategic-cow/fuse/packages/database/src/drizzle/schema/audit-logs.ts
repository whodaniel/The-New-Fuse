/**
 * Drizzle ORM Schema - Audit Logs
 *
 * Comprehensive audit logging for compliance and security monitoring
 */
import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// AUDIT LOGS
// =============================================================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 255 }).notNull(), // e.g., 'user.created', 'agent.deleted'
    resourceType: varchar('resource_type', { length: 100 }), // e.g., 'user', 'agent', 'workflow'
    resourceId: uuid('resource_id'), // UUID of the affected resource
    details: jsonb('details'), // Detailed information about the action
    ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
    userAgent: text('user_agent'), // Browser/client information
    status: varchar('status', { length: 50 }).notNull().default('success'), // 'success', 'failure', 'error'
    errorMessage: text('error_message'), // Error details if status is 'failure' or 'error'
    metadata: jsonb('metadata'), // Additional context (e.g., before/after states)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
