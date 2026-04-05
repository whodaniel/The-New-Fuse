"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameEntitlementsRelations = exports.membershipOverridesRelations = exports.gameEntitlements = exports.gameEntitlementSourceEnum = exports.gameAccessRules = exports.membershipOverrides = exports.membershipOverrideStatusEnum = void 0;
/**
 * Drizzle ORM Schema - Membership Overrides & Game Entitlements
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const billing_1 = require("./billing");
const users_1 = require("./users");
// =============================================================================
// MEMBERSHIP OVERRIDES (Server-side only; bypasses payment processors)
// =============================================================================
exports.membershipOverrideStatusEnum = (0, pg_core_1.pgEnum)('MembershipOverrideStatus', [
    'ACTIVE',
    'REVOKED',
    'EXPIRED',
]);
exports.membershipOverrides = (0, pg_core_1.pgTable)('membership_overrides', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    tier: (0, billing_1.subscriptionTierEnum)('tier').notNull().default('PRO'),
    status: (0, exports.membershipOverrideStatusEnum)('status').notNull().default('ACTIVE'),
    reason: (0, pg_core_1.text)('reason'),
    createdByUserId: (0, pg_core_1.uuid)('created_by_user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    revokedByUserId: (0, pg_core_1.uuid)('revoked_by_user_id').references(() => users_1.users.id, { onDelete: 'set null' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// GAME ACCESS RULES (Policy for each game)
// =============================================================================
exports.gameAccessRules = (0, pg_core_1.pgTable)('game_access_rules', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    gameId: (0, pg_core_1.varchar)('game_id', { length: 120 }).notNull(),
    label: (0, pg_core_1.varchar)('label', { length: 255 }),
    description: (0, pg_core_1.text)('description'),
    requiredTier: (0, billing_1.subscriptionTierEnum)('required_tier').notNull().default('STARTER'),
    requiresMembership: (0, pg_core_1.boolean)('requires_membership').default(false).notNull(),
    requiredNftContract: (0, pg_core_1.varchar)('required_nft_contract', { length: 255 }),
    requiredNftChainId: (0, pg_core_1.integer)('required_nft_chain_id'),
    requiredNftTokenId: (0, pg_core_1.varchar)('required_nft_token_id', { length: 128 }),
    requiredNftTraits: (0, pg_core_1.jsonb)('required_nft_traits'),
    config: (0, pg_core_1.jsonb)('config'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    gameIdUnique: (0, pg_core_1.uniqueIndex)('game_access_rules_game_id_unique').on(table.gameId),
}));
// =============================================================================
// GAME ENTITLEMENTS (Per-user access)
// =============================================================================
exports.gameEntitlementSourceEnum = (0, pg_core_1.pgEnum)('GameEntitlementSource', [
    'membership',
    'override',
    'nft',
    'purchase',
    'admin',
]);
exports.gameEntitlements = (0, pg_core_1.pgTable)('game_entitlements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    gameId: (0, pg_core_1.varchar)('game_id', { length: 120 }).notNull(),
    source: (0, exports.gameEntitlementSourceEnum)('source').notNull().default('membership'),
    tierGranted: (0, billing_1.subscriptionTierEnum)('tier_granted').notNull().default('STARTER'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdByUserId: (0, pg_core_1.uuid)('created_by_user_id').references(() => users_1.users.id, {
        onDelete: 'set null',
    }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userGameUnique: (0, pg_core_1.uniqueIndex)('game_entitlements_user_game_unique').on(table.userId, table.gameId),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.membershipOverridesRelations = (0, drizzle_orm_1.relations)(exports.membershipOverrides, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.membershipOverrides.userId],
        references: [users_1.users.id],
    }),
    createdBy: one(users_1.users, {
        fields: [exports.membershipOverrides.createdByUserId],
        references: [users_1.users.id],
    }),
    revokedBy: one(users_1.users, {
        fields: [exports.membershipOverrides.revokedByUserId],
        references: [users_1.users.id],
    }),
}));
exports.gameEntitlementsRelations = (0, drizzle_orm_1.relations)(exports.gameEntitlements, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.gameEntitlements.userId],
        references: [users_1.users.id],
    }),
    createdBy: one(users_1.users, {
        fields: [exports.gameEntitlements.createdByUserId],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=entitlements.js.map