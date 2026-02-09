/**
 * Drizzle ORM Schema - User Management & Authentication
 */
import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

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
  walletAddress: varchar('wallet_address', { length: 255 }).unique(),
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
