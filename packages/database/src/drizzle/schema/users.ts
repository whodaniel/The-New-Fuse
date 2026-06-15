/**
 * Drizzle ORM Schema - User Management & Authentication
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { userRoleEnum } from './enums.js';
import { workspaceMembers, workspaces } from './workspace.js';

// =============================================================================
// USER
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  roles: jsonb('roles').$type<string[]>().default(['USER']).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  preferences: jsonb('preferences'),
  refreshToken: text('refresh_token'),
  deletedAt: timestamp('deleted_at'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationExpires: timestamp('verification_expires'),
  walletAddress: varchar('wallet_address', { length: 255 }).unique(),
  // Phase 5 (audit 2026-06-14): denormalized links + per-agent qualities for
  // hot-path queries. Source of truth remains the `agents` table joined on
  // agents.userId; activeAgentIds is updated/refreshed on heartbeat and used
  // for "what is this user running right now" without a join.
  activeAgentIds: jsonb('active_agent_ids').$type<string[]>().default([]).notNull(),
  agentQualities: jsonb('agent_qualities')
    .$type<{
      defaultModel?: string;
      defaultVendor?: string;
      tierFallback?: string[];
      raw?: Record<string, unknown>;
    }>()
    .default({})
    .notNull(),
});

export const inviteCodeStatusEnum = pgEnum('InviteCodeStatus', ['ACTIVE', 'DISABLED']);

export const registrationInviteCodes = pgTable('registration_invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 128 }).unique().notNull(),
  label: varchar('label', { length: 255 }),
  federationId: varchar('federation_id', { length: 255 }),
  status: inviteCodeStatusEnum('status').notNull().default('ACTIVE'),
  maxUses: integer('max_uses').default(1).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AUTH SESSION
// =============================================================================

export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 512 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// LOGIN ATTEMPT
// =============================================================================

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  successful: boolean('successful').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// AUTH EVENT
// =============================================================================

export const authEvents = pgTable('auth_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  authSessions: many(authSessions),
  loginAttempts: many(loginAttempts),
  authEvents: many(authEvents),
  createdInviteCodes: many(registrationInviteCodes),
  agents: many(agents),
  workspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
}));

export const registrationInviteCodesRelations = relations(registrationInviteCodes, ({ one }) => ({
  createdBy: one(users, {
    fields: [registrationInviteCodes.createdByUserId],
    references: [users.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));

export const authEventsRelations = relations(authEvents, ({ one }) => ({
  user: one(users, {
    fields: [authEvents.userId],
    references: [users.id],
  }),
}));
