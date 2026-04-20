/**
 * Drizzle ORM Schema - Membership Overrides & Game Entitlements
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
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { subscriptionTierEnum } from './billing.js';
import { users } from './users.js';

// =============================================================================
// MEMBERSHIP OVERRIDES (Server-side only; bypasses payment processors)
// =============================================================================

export const membershipOverrideStatusEnum = pgEnum('MembershipOverrideStatus', [
  'ACTIVE',
  'REVOKED',
  'EXPIRED',
]);

export const membershipOverrides = pgTable('membership_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tier: subscriptionTierEnum('tier').notNull().default('PRO'),
  status: membershipOverrideStatusEnum('status').notNull().default('ACTIVE'),
  reason: text('reason'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  revokedByUserId: uuid('revoked_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// GAME ACCESS RULES (Policy for each game)
// =============================================================================

export const gameAccessRules = pgTable(
  'game_access_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 120 }).notNull(),
    label: varchar('label', { length: 255 }),
    description: text('description'),
    requiredTier: subscriptionTierEnum('required_tier').notNull().default('STARTER'),
    requiresMembership: boolean('requires_membership').default(false).notNull(),
    requiredNftContract: varchar('required_nft_contract', { length: 255 }),
    requiredNftChainId: integer('required_nft_chain_id'),
    requiredNftTokenId: varchar('required_nft_token_id', { length: 128 }),
    requiredNftTraits: jsonb('required_nft_traits'),
    config: jsonb('config'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    gameIdUnique: uniqueIndex('game_access_rules_game_id_unique').on(table.gameId),
  })
);

// =============================================================================
// GAME ENTITLEMENTS (Per-user access)
// =============================================================================

export const gameEntitlementSourceEnum = pgEnum('GameEntitlementSource', [
  'membership',
  'override',
  'nft',
  'purchase',
  'admin',
]);

export const gameEntitlements = pgTable(
  'game_entitlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: varchar('game_id', { length: 120 }).notNull(),
    source: gameEntitlementSourceEnum('source').notNull().default('membership'),
    tierGranted: subscriptionTierEnum('tier_granted').notNull().default('STARTER'),
    expiresAt: timestamp('expires_at'),
    metadata: jsonb('metadata'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userGameUnique: uniqueIndex('game_entitlements_user_game_unique').on(
      table.userId,
      table.gameId
    ),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const membershipOverridesRelations = relations(membershipOverrides, ({ one }) => ({
  user: one(users, {
    fields: [membershipOverrides.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [membershipOverrides.createdByUserId],
    references: [users.id],
  }),
  revokedBy: one(users, {
    fields: [membershipOverrides.revokedByUserId],
    references: [users.id],
  }),
}));

export const gameEntitlementsRelations = relations(gameEntitlements, ({ one }) => ({
  user: one(users, {
    fields: [gameEntitlements.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [gameEntitlements.createdByUserId],
    references: [users.id],
  }),
}));
