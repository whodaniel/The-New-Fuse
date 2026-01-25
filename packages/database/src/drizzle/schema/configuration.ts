import { boolean, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// =============================================================================
// SYSTEM CONFIGURATION (Key-Value pairs for Environment/Feature flags)
// =============================================================================

export const systemConfigurations = pgTable('system_configurations', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
  category: varchar('category', { length: 100 }).default('general').notNull(),
  description: text('description'),
  sensitive: boolean('sensitive').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
});

// =============================================================================
// SYSTEM SETTINGS (Singleton Application Settings)
// =============================================================================

export const systemSettings = pgTable('system_settings', {
  id: integer('id').primaryKey().default(1),
  config: jsonb('config').$type<any>().notNull(), // Stores the nested settings object
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
});
