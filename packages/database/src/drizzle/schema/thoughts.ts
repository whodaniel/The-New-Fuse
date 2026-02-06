import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core';
import { users } from './users';

export const thoughts = pgTable('thoughts', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  category: text('category'),
  tags: text('tags').array(),
  relevanceScore: real('relevance_score').default(0),
  userId: text('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
