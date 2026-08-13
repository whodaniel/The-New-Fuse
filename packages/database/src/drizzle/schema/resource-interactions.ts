import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const resourceFavorites = pgTable(
  'resource_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resourceId: varchar('resource_id', { length: 255 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    resourceUserUnique: uniqueIndex('resource_favorites_resource_user_unique').on(
      table.resourceId,
      table.userId
    ),
    userIdx: index('idx_resource_favorites_user_id').on(table.userId),
    resourceIdx: index('idx_resource_favorites_resource_id').on(table.resourceId),
  })
);

export const resourceShares = pgTable(
  'resource_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resourceId: varchar('resource_id', { length: 255 }).notNull(),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toAgentId: varchar('to_agent_id', { length: 255 }).notNull(),
    notes: text('notes'),
    sharedAt: timestamp('shared_at').defaultNow().notNull(),
  },
  (table) => ({
    fromUserIdx: index('idx_resource_shares_from_user_id').on(table.fromUserId),
    toAgentIdx: index('idx_resource_shares_to_agent_id').on(table.toAgentId),
    resourceIdx: index('idx_resource_shares_resource_id').on(table.resourceId),
  })
);
