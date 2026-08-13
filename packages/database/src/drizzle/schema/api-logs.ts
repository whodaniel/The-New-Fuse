import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const apiLogs = pgTable('api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  method: varchar('method', { length: 10 }).notNull(),
  path: text('path').notNull(),
  statusCode: integer('status_code').notNull(),
  duration: integer('duration').notNull(), // in milliseconds
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
