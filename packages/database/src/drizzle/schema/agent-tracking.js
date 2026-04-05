"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRequestLogRelations = exports.agentSessionsRelations = exports.agentTrackingRelations = exports.agentRequestLog = exports.agentSessions = exports.agentTracking = void 0;
/**
 * Drizzle ORM Schema - Agent Tracking & Identity
 *
 * Tracks agent connections, sessions, and builds reputation scores
 * based on behavior patterns.
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
// =============================================================================
// AGENT TRACKING
// =============================================================================
/**
 * Stores agent identity and tracking information
 * Records first contact IP, TLS fingerprint, and builds reputation over time
 */
exports.agentTracking = (0, pg_core_1.pgTable)('agent_tracking', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Agent identification
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id, { onDelete: 'cascade' }),
    // Network identification
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }).notNull(),
    tlsFingerprint: (0, pg_core_1.varchar)('tls_fingerprint', { length: 128 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    // Wallet/identity association (for blockchain agents)
    walletAddress: (0, pg_core_1.varchar)('wallet_address', { length: 255 }),
    // Timestamps
    firstSeen: (0, pg_core_1.timestamp)('first_seen').defaultNow().notNull(),
    lastSeen: (0, pg_core_1.timestamp)('last_seen').defaultNow().notNull(),
    // Reputation system
    reputationScore: (0, pg_core_1.real)('reputation_score').default(100).notNull(),
    reputationFactors: (0, pg_core_1.jsonb)('reputation_factors').$type().default({
        successfulRequests: 0,
        failedRequests: 0,
        suspiciousActivity: 0,
        abuseReports: 0,
        lastCalculated: new Date().toISOString(),
    }),
    // Abuse detection
    abuseCheckStatus: (0, pg_core_1.varchar)('abuse_check_status', { length: 20 }).default('CLEAN'),
    abuseCheckLastRun: (0, pg_core_1.timestamp)('abuse_check_last_run'),
    abuseCheckDetails: (0, pg_core_1.jsonb)('abuse_check_details'),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    agentIdIdx: (0, pg_core_1.index)('agent_tracking_agent_id_idx').on(table.agentId),
    ipAddressIdx: (0, pg_core_1.index)('agent_tracking_ip_address_idx').on(table.ipAddress),
    walletAddressIdx: (0, pg_core_1.index)('agent_tracking_wallet_address_idx').on(table.walletAddress),
    lastSeenIdx: (0, pg_core_1.index)('agent_tracking_last_seen_idx').on(table.lastSeen),
}));
// =============================================================================
// AGENT SESSIONS
// =============================================================================
/**
 * Tracks individual agent sessions
 * Each session represents a connection from a specific IP
 */
exports.agentSessions = (0, pg_core_1.pgTable)('agent_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Session identification
    sessionId: (0, pg_core_1.varchar)('session_id', { length: 128 }).unique().notNull(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id, { onDelete: 'cascade' }),
    // Session details
    originIp: (0, pg_core_1.varchar)('origin_ip', { length: 45 }).notNull(),
    tlsFingerprint: (0, pg_core_1.varchar)('tls_fingerprint', { length: 128 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    // Session lifecycle
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    lastActivityAt: (0, pg_core_1.timestamp)('last_activity_at').defaultNow().notNull(),
    // Session state
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    terminationReason: (0, pg_core_1.varchar)('termination_reason', { length: 100 }),
    // Request statistics
    requestCount: (0, pg_core_1.integer)('request_count').default(0).notNull(),
    errorCount: (0, pg_core_1.integer)('error_count').default(0).notNull(),
    // Metadata
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
}, (table) => ({
    sessionIdIdx: (0, pg_core_1.index)('agent_sessions_session_id_idx').on(table.sessionId),
    agentIdIdx: (0, pg_core_1.index)('agent_sessions_agent_id_idx').on(table.agentId),
    originIpIdx: (0, pg_core_1.index)('agent_sessions_origin_ip_idx').on(table.originIp),
    isActiveIdx: (0, pg_core_1.index)('agent_sessions_is_active_idx').on(table.isActive),
    expiresAtIdx: (0, pg_core_1.index)('agent_sessions_expires_at_idx').on(table.expiresAt),
}));
// =============================================================================
// AGENT REQUEST LOG
// =============================================================================
/**
 * Detailed request logging for agent activity analysis
 */
exports.agentRequestLog = (0, pg_core_1.pgTable)('agent_request_log', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Agent and session identification
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id, { onDelete: 'cascade' }),
    sessionId: (0, pg_core_1.uuid)('session_id')
        .references(() => exports.agentSessions.id, { onDelete: 'set null' }),
    trackingId: (0, pg_core_1.uuid)('tracking_id')
        .references(() => exports.agentTracking.id, { onDelete: 'set null' }),
    // Request details
    requestId: (0, pg_core_1.varchar)('request_id', { length: 64 }).notNull(),
    method: (0, pg_core_1.varchar)('method', { length: 10 }).notNull(),
    path: (0, pg_core_1.text)('path').notNull(),
    userAgent: (0, pg_core_1.text)('user_agent'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }).notNull(),
    // Response details
    statusCode: (0, pg_core_1.integer)('status_code'),
    responseTimeMs: (0, pg_core_1.integer)('response_time_ms'),
    // Request categorization
    endpoint: (0, pg_core_1.varchar)('endpoint', { length: 100 }),
    action: (0, pg_core_1.varchar)('action', { length: 50 }),
    // Error tracking
    errorType: (0, pg_core_1.varchar)('error_type', { length: 50 }),
    errorMessage: (0, pg_core_1.text)('error_message'),
    // Timestamp
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow().notNull(),
    // Additional metadata
    metadata: (0, pg_core_1.jsonb)('metadata').default({}),
}, (table) => ({
    agentIdIdx: (0, pg_core_1.index)('agent_request_log_agent_id_idx').on(table.agentId),
    sessionIdIdx: (0, pg_core_1.index)('agent_request_log_session_id_idx').on(table.sessionId),
    timestampIdx: (0, pg_core_1.index)('agent_request_log_timestamp_idx').on(table.timestamp),
    ipAddressIdx: (0, pg_core_1.index)('agent_request_log_ip_address_idx').on(table.ipAddress),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.agentTrackingRelations = (0, drizzle_orm_1.relations)(exports.agentTracking, ({ one, many }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.agentTracking.agentId],
        references: [agents_1.agents.id],
    }),
    sessions: many(exports.agentSessions),
    requestLogs: many(exports.agentRequestLog),
}));
exports.agentSessionsRelations = (0, drizzle_orm_1.relations)(exports.agentSessions, ({ one, many }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.agentSessions.agentId],
        references: [agents_1.agents.id],
    }),
    requestLogs: many(exports.agentRequestLog),
}));
exports.agentRequestLogRelations = (0, drizzle_orm_1.relations)(exports.agentRequestLog, ({ one }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.agentRequestLog.agentId],
        references: [agents_1.agents.id],
    }),
    session: one(exports.agentSessions, {
        fields: [exports.agentRequestLog.sessionId],
        references: [exports.agentSessions.id],
    }),
    tracking: one(exports.agentTracking, {
        fields: [exports.agentRequestLog.trackingId],
        references: [exports.agentTracking.id],
    }),
}));
//# sourceMappingURL=agent-tracking.js.map