/**
 * Drizzle ORM Schema - TNF Hosted Spaces
 *
 * Parity target: Zo Computer's `zo.space` — managed hosting for React page
 * routes and Hono-style API routes, with static assets and public/private
 * visibility per route. See docs/TNF_HOSTED_SPACES_ARCHITECTURE.md.
 */
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const spaces = pgTable(
  'spaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    subdomain: varchar('subdomain', { length: 63 }).notNull(),
    customDomains: jsonb('custom_domains').$type<string[]>().default([]).notNull(),
    plan: varchar('plan', { length: 32 }).default('free').notNull(), // free | basic | pro | ultra
    status: varchar('status', { length: 32 }).default('active').notNull(), // active | suspended
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    subdomainUnique: uniqueIndex('spaces_subdomain_unique').on(table.subdomain),
  })
);

export const spaceRoutes = pgTable(
  'space_routes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 512 }).notNull(),
    routeType: varchar('route_type', { length: 16 }).notNull(), // page | api
    code: text('code').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    spacePathUnique: uniqueIndex('space_routes_space_id_path_unique').on(
      table.spaceId,
      table.path
    ),
  })
);

export const spaceAssets = pgTable(
  'space_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    assetPath: varchar('asset_path', { length: 512 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    storageKey: text('storage_key').notNull(),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  },
  (table) => ({
    spaceAssetPathUnique: uniqueIndex('space_assets_space_id_asset_path_unique').on(
      table.spaceId,
      table.assetPath
    ),
  })
);
