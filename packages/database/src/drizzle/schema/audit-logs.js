"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRelations = exports.auditLogs = void 0;
/**
 * Drizzle ORM Schema - Audit Logs
 *
 * Comprehensive audit logging for compliance and security monitoring
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// AUDIT LOGS
// =============================================================================
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    action: (0, pg_core_1.varchar)('action', { length: 255 }).notNull(), // e.g., 'user.created', 'agent.deleted'
    resourceType: (0, pg_core_1.varchar)('resource_type', { length: 100 }), // e.g., 'user', 'agent', 'workflow'
    resourceId: (0, pg_core_1.uuid)('resource_id'), // UUID of the affected resource
    details: (0, pg_core_1.jsonb)('details'), // Detailed information about the action
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }), // IPv4 or IPv6
    userAgent: (0, pg_core_1.text)('user_agent'), // Browser/client information
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('success'), // 'success', 'failure', 'error'
    errorMessage: (0, pg_core_1.text)('error_message'), // Error details if status is 'failure' or 'error'
    metadata: (0, pg_core_1.jsonb)('metadata'), // Additional context (e.g., before/after states)
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: (0, pg_core_1.index)('audit_logs_user_id_idx').on(table.userId),
    createdAtIdx: (0, pg_core_1.index)('audit_logs_created_at_idx').on(table.createdAt),
    resourceIdx: (0, pg_core_1.index)('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
    actionIdx: (0, pg_core_1.index)('audit_logs_action_idx').on(table.action),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(exports.auditLogs, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.auditLogs.userId],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=audit-logs.js.map