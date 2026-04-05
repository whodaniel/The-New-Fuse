"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageRecordsRelations = exports.creditBalancesRelations = exports.stripeSubscriptionsRelations = exports.payPalSubscriptionsRelations = exports.usageRecords = exports.creditBalances = exports.stripeSubscriptions = exports.payPalSubscriptions = exports.usageTypeEnum = exports.subscriptionTierEnum = exports.subscriptionStatusEnum = void 0;
/**
 * Drizzle ORM Schema - Billing & Subscriptions
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// ENUMS
// =============================================================================
exports.subscriptionStatusEnum = (0, pg_core_1.pgEnum)('SubscriptionStatus', [
    'ACTIVE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED',
    'PENDING',
]);
exports.subscriptionTierEnum = (0, pg_core_1.pgEnum)('SubscriptionTier', [
    'STARTER', // Free
    'PRO', // $30/mo
    'ENTERPRISE',
]);
exports.usageTypeEnum = (0, pg_core_1.pgEnum)('UsageType', [
    'LLM_TOKEN_INPUT',
    'LLM_TOKEN_OUTPUT',
    'CODE_EXECUTION_MINUTES',
    'VECTOR_STORAGE_MB',
]);
// =============================================================================
// PAYPAL SUBSCRIPTIONS
// =============================================================================
exports.payPalSubscriptions = (0, pg_core_1.pgTable)('paypal_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    payPalSubscriptionId: (0, pg_core_1.varchar)('paypal_subscription_id', { length: 255 }).unique().notNull(), // From PayPal API
    payPalPlanId: (0, pg_core_1.varchar)('paypal_plan_id', { length: 255 }).notNull(),
    status: (0, exports.subscriptionStatusEnum)('status').notNull().default('PENDING'),
    tier: (0, exports.subscriptionTierEnum)('tier').notNull().default('STARTER'),
    currentPeriodStart: (0, pg_core_1.timestamp)('current_period_start').notNull(),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end').notNull(),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// STRIPE SUBSCRIPTIONS
// =============================================================================
exports.stripeSubscriptions = (0, pg_core_1.pgTable)('stripe_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    stripeCustomerId: (0, pg_core_1.varchar)('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: (0, pg_core_1.varchar)('stripe_subscription_id', { length: 255 }).unique().notNull(),
    stripePriceId: (0, pg_core_1.varchar)('stripe_price_id', { length: 255 }),
    status: (0, exports.subscriptionStatusEnum)('status').notNull().default('PENDING'),
    tier: (0, exports.subscriptionTierEnum)('tier').notNull().default('STARTER'),
    currentPeriodStart: (0, pg_core_1.timestamp)('current_period_start').notNull(),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end').notNull(),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// CREDIT BALANCES
// =============================================================================
// Used for "Top Up" or "Overage" billing
exports.creditBalances = (0, pg_core_1.pgTable)('credit_balances', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    balance: (0, pg_core_1.doublePrecision)('balance').default(0.0).notNull(), // Amount in USD
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).default('USD').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// USAGE RECORDS
// =============================================================================
// Tracks granular usage for billing
exports.usageRecords = (0, pg_core_1.pgTable)('usage_records', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    type: (0, exports.usageTypeEnum)('type').notNull(),
    amount: (0, pg_core_1.doublePrecision)('amount').notNull(), // Tokens, Minutes, etc.
    cost: (0, pg_core_1.doublePrecision)('cost').notNull(), // Calculated Cost to User (USD)
    description: (0, pg_core_1.text)('description'), // E.g., "GPT-4 Completion"
    metadata: (0, pg_core_1.text)('metadata'), // JSON string for extra details
    charged: (0, pg_core_1.boolean)('charged').default(false).notNull(), // If true, deducted from balance or billed
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.payPalSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.payPalSubscriptions, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.payPalSubscriptions.userId],
        references: [users_1.users.id],
    }),
}));
exports.stripeSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.stripeSubscriptions, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.stripeSubscriptions.userId],
        references: [users_1.users.id],
    }),
}));
exports.creditBalancesRelations = (0, drizzle_orm_1.relations)(exports.creditBalances, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.creditBalances.userId],
        references: [users_1.users.id],
    }),
}));
exports.usageRecordsRelations = (0, drizzle_orm_1.relations)(exports.usageRecords, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.usageRecords.userId],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=billing.js.map