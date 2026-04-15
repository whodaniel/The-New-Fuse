/**
 * Drizzle ORM Schema - Billing & Subscriptions
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// ENUMS
// =============================================================================

export const subscriptionStatusEnum = pgEnum('SubscriptionStatus', [
  'ACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
  'PENDING',
]);

export const subscriptionTierEnum = pgEnum('SubscriptionTier', [
  'STARTER', // Free
  'PRO', // $30/mo
  'ENTERPRISE',
]);

export const usageTypeEnum = pgEnum('UsageType', [
  'LLM_TOKEN_INPUT',
  'LLM_TOKEN_OUTPUT',
  'CODE_EXECUTION_MINUTES',
  'VECTOR_STORAGE_MB',
]);

// =============================================================================
// PAYPAL SUBSCRIPTIONS
// =============================================================================

export const payPalSubscriptions = pgTable('paypal_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  payPalSubscriptionId: varchar('paypal_subscription_id', { length: 255 }).unique().notNull(), // From PayPal API
  payPalPlanId: varchar('paypal_plan_id', { length: 255 }).notNull(),
  status: subscriptionStatusEnum('status').notNull().default('PENDING'),
  tier: subscriptionTierEnum('tier').notNull().default('STARTER'),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// CREDIT BALANCES
// =============================================================================
// Used for "Top Up" or "Overage" billing

export const creditBalances = pgTable('credit_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: doublePrecision('balance').default(0.0).notNull(), // Amount in USD
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// USAGE RECORDS
// =============================================================================
// Tracks granular usage for billing

export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: usageTypeEnum('type').notNull(),
  amount: doublePrecision('amount').notNull(), // Tokens, Minutes, etc.
  cost: doublePrecision('cost').notNull(), // Calculated Cost to User (USD)
  description: text('description'), // E.g., "GPT-4 Completion"
  metadata: text('metadata'), // JSON string for extra details
  charged: boolean('charged').default(false).notNull(), // If true, deducted from balance or billed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const payPalSubscriptionsRelations = relations(payPalSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [payPalSubscriptions.userId],
    references: [users.id],
  }),
}));

export const creditBalancesRelations = relations(creditBalances, ({ one }) => ({
  user: one(users, {
    fields: [creditBalances.userId],
    references: [users.id],
  }),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  user: one(users, {
    fields: [usageRecords.userId],
    references: [users.id],
  }),
}));
