"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRelations = exports.walletsRelations = exports.transactions = exports.wallets = void 0;
/**
 * Drizzle ORM Schema - Wallet & Transaction System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
// =============================================================================
// WALLET
// =============================================================================
exports.wallets = (0, pg_core_1.pgTable)('wallets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    address: (0, pg_core_1.varchar)('address', { length: 100 }).unique().notNull(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .unique()
        .references(() => agents_1.agents.id),
    type: (0, enums_1.walletTypeEnum)('type').default('SMART_ACCOUNT').notNull(),
    balance: (0, pg_core_1.decimal)('balance', { precision: 38, scale: 18 }).default('0').notNull(),
    nonce: (0, pg_core_1.integer)('nonce').default(0).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    lastActivity: (0, pg_core_1.timestamp)('last_activity'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// TRANSACTION
// =============================================================================
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    hash: (0, pg_core_1.varchar)('hash', { length: 100 }).unique().notNull(),
    walletId: (0, pg_core_1.uuid)('wallet_id')
        .notNull()
        .references(() => exports.wallets.id, { onDelete: 'cascade' }),
    fromAddress: (0, pg_core_1.varchar)('from_address', { length: 100 }).notNull(),
    toAddress: (0, pg_core_1.varchar)('to_address', { length: 100 }).notNull(),
    value: (0, pg_core_1.decimal)('value', { precision: 38, scale: 18 }).notNull(),
    gasPrice: (0, pg_core_1.decimal)('gas_price', { precision: 38, scale: 18 }).notNull(),
    gasUsed: (0, pg_core_1.integer)('gas_used').notNull(),
    gasLimit: (0, pg_core_1.integer)('gas_limit').notNull(),
    status: (0, enums_1.transactionStatusEnum)('status').default('PENDING').notNull(),
    blockNumber: (0, pg_core_1.integer)('block_number'),
    blockHash: (0, pg_core_1.varchar)('block_hash', { length: 100 }),
    type: (0, enums_1.transactionTypeEnum)('type').default('TRANSFER').notNull(),
    data: (0, pg_core_1.jsonb)('data'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    confirmedAt: (0, pg_core_1.timestamp)('confirmed_at'),
}, (table) => ({
    walletIdIdx: (0, pg_core_1.index)('tx_wallet_id_idx').on(table.walletId),
    hashIdx: (0, pg_core_1.index)('tx_hash_idx').on(table.hash),
    statusIdx: (0, pg_core_1.index)('tx_status_idx').on(table.status),
    createdAtIdx: (0, pg_core_1.index)('tx_created_at_idx').on(table.createdAt),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.walletsRelations = (0, drizzle_orm_1.relations)(exports.wallets, ({ one, many }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.wallets.agentId],
        references: [agents_1.agents.id],
    }),
    transactions: many(exports.transactions),
}));
exports.transactionsRelations = (0, drizzle_orm_1.relations)(exports.transactions, ({ one }) => ({
    wallet: one(exports.wallets, {
        fields: [exports.transactions.walletId],
        references: [exports.wallets.id],
    }),
}));
//# sourceMappingURL=wallets.js.map