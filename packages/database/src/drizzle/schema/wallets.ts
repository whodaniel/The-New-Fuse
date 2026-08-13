/**
 * Drizzle ORM Schema - Wallet & Transaction System
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { transactionStatusEnum, transactionTypeEnum, walletTypeEnum } from './enums.js';

// =============================================================================
// WALLET
// =============================================================================

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 100 }).unique().notNull(),
  agentId: uuid('agent_id')
    .unique()
    .references(() => agents.id),
  type: walletTypeEnum('type').default('SMART_ACCOUNT').notNull(),
  balance: decimal('balance', { precision: 38, scale: 18 }).default('0').notNull(),
  nonce: integer('nonce').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivity: timestamp('last_activity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TRANSACTION
// =============================================================================

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hash: varchar('hash', { length: 100 }).unique().notNull(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    fromAddress: varchar('from_address', { length: 100 }).notNull(),
    toAddress: varchar('to_address', { length: 100 }).notNull(),
    value: decimal('value', { precision: 38, scale: 18 }).notNull(),
    gasPrice: decimal('gas_price', { precision: 38, scale: 18 }).notNull(),
    gasUsed: integer('gas_used').notNull(),
    gasLimit: integer('gas_limit').notNull(),
    status: transactionStatusEnum('status').default('PENDING').notNull(),
    blockNumber: integer('block_number'),
    blockHash: varchar('block_hash', { length: 100 }),
    type: transactionTypeEnum('type').default('TRANSFER').notNull(),
    data: jsonb('data'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
  },
  (table) => ({
    walletIdIdx: index('tx_wallet_id_idx').on(table.walletId),
    hashIdx: index('tx_hash_idx').on(table.hash),
    statusIdx: index('tx_status_idx').on(table.status),
    createdAtIdx: index('tx_created_at_idx').on(table.createdAt),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  agent: one(agents, {
    fields: [wallets.agentId],
    references: [agents.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));
