/**
 * Drizzle ORM Schema - Agent Tracking & Identity
 * 
 * Tracks agent connections, sessions, and builds reputation scores
 * based on behavior patterns.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { agents } from './agents.js';

// =============================================================================
// AGENT TRACKING
// =============================================================================

/**
 * Stores agent identity and tracking information
 * Records first contact IP, TLS fingerprint, and builds reputation over time
 */
export const agentTracking = pgTable('agent_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Agent identification
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  
  // Network identification
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  tlsFingerprint: varchar('tls_fingerprint', { length: 128 }),
  userAgent: text('user_agent'),
  
  // Wallet/identity association (for blockchain agents)
  walletAddress: varchar('wallet_address', { length: 255 }),
  
  // Timestamps
  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  
  // Reputation system
  reputationScore: real('reputation_score').default(100).notNull(),
  reputationFactors: jsonb('reputation_factors').$type<{
    successfulRequests: number;
    failedRequests: number;
    suspiciousActivity: number;
    abuseReports: number;
    lastCalculated: string;
  }>().default({
    successfulRequests: 0,
    failedRequests: 0,
    suspiciousActivity: 0,
    abuseReports: 0,
    lastCalculated: new Date().toISOString(),
  }),
  
  // Abuse detection
  abuseCheckStatus: varchar('abuse_check_status', { length: 20 }).default('CLEAN'),
  abuseCheckLastRun: timestamp('abuse_check_last_run'),
  abuseCheckDetails: jsonb('abuse_check_details'),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agentIdIdx: index('agent_tracking_agent_id_idx').on(table.agentId),
  ipAddressIdx: index('agent_tracking_ip_address_idx').on(table.ipAddress),
  walletAddressIdx: index('agent_tracking_wallet_address_idx').on(table.walletAddress),
  lastSeenIdx: index('agent_tracking_last_seen_idx').on(table.lastSeen),
}));

// =============================================================================
// AGENT SESSIONS
// =============================================================================

/**
 * Tracks individual agent sessions
 * Each session represents a connection from a specific IP
 */
export const agentSessions = pgTable('agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Session identification
  sessionId: varchar('session_id', { length: 128 }).unique().notNull(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  
  // Session details
  originIp: varchar('origin_ip', { length: 45 }).notNull(),
  tlsFingerprint: varchar('tls_fingerprint', { length: 128 }),
  userAgent: text('user_agent'),
  
  // Session lifecycle
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  
  // Session state
  isActive: boolean('is_active').default(true).notNull(),
  terminationReason: varchar('termination_reason', { length: 100 }),
  
  // Request statistics
  requestCount: integer('request_count').default(0).notNull(),
  errorCount: integer('error_count').default(0).notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
}, (table) => ({
  sessionIdIdx: index('agent_sessions_session_id_idx').on(table.sessionId),
  agentIdIdx: index('agent_sessions_agent_id_idx').on(table.agentId),
  originIpIdx: index('agent_sessions_origin_ip_idx').on(table.originIp),
  isActiveIdx: index('agent_sessions_is_active_idx').on(table.isActive),
  expiresAtIdx: index('agent_sessions_expires_at_idx').on(table.expiresAt),
}));

// =============================================================================
// AGENT REQUEST LOG
// =============================================================================

/**
 * Detailed request logging for agent activity analysis
 */
export const agentRequestLog = pgTable('agent_request_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Agent and session identification
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id')
    .references(() => agentSessions.id, { onDelete: 'set null' }),
  trackingId: uuid('tracking_id')
    .references(() => agentTracking.id, { onDelete: 'set null' }),
  
  // Request details
  requestId: varchar('request_id', { length: 64 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  path: text('path').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  
  // Response details
  statusCode: integer('status_code'),
  responseTimeMs: integer('response_time_ms'),
  
  // Request categorization
  endpoint: varchar('endpoint', { length: 100 }),
  action: varchar('action', { length: 50 }),
  
  // Error tracking
  errorType: varchar('error_type', { length: 50 }),
  errorMessage: text('error_message'),
  
  // Timestamp
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // Additional metadata
  metadata: jsonb('metadata').default({}),
}, (table) => ({
  agentIdIdx: index('agent_request_log_agent_id_idx').on(table.agentId),
  sessionIdIdx: index('agent_request_log_session_id_idx').on(table.sessionId),
  timestampIdx: index('agent_request_log_timestamp_idx').on(table.timestamp),
  ipAddressIdx: index('agent_request_log_ip_address_idx').on(table.ipAddress),
}));

// =============================================================================
// RELATIONS
// =============================================================================

export const agentTrackingRelations = relations(agentTracking, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentTracking.agentId],
    references: [agents.id],
  }),
  sessions: many(agentSessions),
  requestLogs: many(agentRequestLog),
}));

export const agentSessionsRelations = relations(agentSessions, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentSessions.agentId],
    references: [agents.id],
  }),
  requestLogs: many(agentRequestLog),
}));

export const agentRequestLogRelations = relations(agentRequestLog, ({ one }) => ({
  agent: one(agents, {
    fields: [agentRequestLog.agentId],
    references: [agents.id],
  }),
  session: one(agentSessions, {
    fields: [agentRequestLog.sessionId],
    references: [agentSessions.id],
  }),
  tracking: one(agentTracking, {
    fields: [agentRequestLog.trackingId],
    references: [agentTracking.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type AgentTracking = typeof agentTracking.$inferSelect;
export type NewAgentTracking = typeof agentTracking.$inferInsert;
export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;
export type AgentRequestLog = typeof agentRequestLog.$inferSelect;
export type NewAgentRequestLog = typeof agentRequestLog.$inferInsert;

export type AbuseCheckStatus = 'CLEAN' | 'SUSPICIOUS' | 'FLAGGED' | 'BLOCKED';
export type ReputationFactors = {
  successfulRequests: number;
  failedRequests: number;
  suspiciousActivity: number;
  abuseReports: number;
  lastCalculated: string;
};
