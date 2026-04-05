"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceShares = exports.resourceFavorites = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.resourceFavorites = (0, pg_core_1.pgTable)('resource_favorites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    resourceId: (0, pg_core_1.varchar)('resource_id', { length: 255 }).notNull(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    resourceUserUnique: (0, pg_core_1.uniqueIndex)('resource_favorites_resource_user_unique').on(table.resourceId, table.userId),
    userIdx: (0, pg_core_1.index)('idx_resource_favorites_user_id').on(table.userId),
    resourceIdx: (0, pg_core_1.index)('idx_resource_favorites_resource_id').on(table.resourceId),
}));
exports.resourceShares = (0, pg_core_1.pgTable)('resource_shares', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    resourceId: (0, pg_core_1.varchar)('resource_id', { length: 255 }).notNull(),
    fromUserId: (0, pg_core_1.uuid)('from_user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    toAgentId: (0, pg_core_1.varchar)('to_agent_id', { length: 255 }).notNull(),
    notes: (0, pg_core_1.text)('notes'),
    sharedAt: (0, pg_core_1.timestamp)('shared_at').defaultNow().notNull(),
}, (table) => ({
    fromUserIdx: (0, pg_core_1.index)('idx_resource_shares_from_user_id').on(table.fromUserId),
    toAgentIdx: (0, pg_core_1.index)('idx_resource_shares_to_agent_id').on(table.toAgentId),
    resourceIdx: (0, pg_core_1.index)('idx_resource_shares_resource_id').on(table.resourceId),
}));
//# sourceMappingURL=resource-interactions.js.map