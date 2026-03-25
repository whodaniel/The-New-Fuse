import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const personalSkills = pgTable(
  'personal_skills',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 180 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description').default('').notNull(),
    instructions: text('instructions').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    isPrivate: boolean('is_private').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userSlugUniqueIdx: uniqueIndex('personal_skills_user_slug_uq').on(table.userId, table.slug),
    userIdx: index('personal_skills_user_idx').on(table.userId),
    userUpdatedIdx: index('personal_skills_user_updated_idx').on(table.userId, table.updatedAt),
  })
);
