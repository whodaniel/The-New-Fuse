/**
 * Drizzle ORM Schema - AI Assets Marketplace (Crawl4AI Ingestion)
 */
import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const aiAssetsMarketplace = pgSchema('ai_assets_marketplace');

// =============================================================================
// INGESTION TABLES
// =============================================================================

export const aiAssetCategories = aiAssetsMarketplace.table(
  'categories',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('ai_assets_categories_name_uq').on(table.name),
  })
);

export const aiAssetSources = aiAssetsMarketplace.table(
  'sources',
  {
    id: integer('id').primaryKey(),
    categoryId: integer('category_id').notNull(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    brief: text('brief'),
    sourceType: varchar('source_type', { length: 80 }),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    categoryIdx: index('ai_assets_sources_category_id_idx').on(table.categoryId),
    urlIdx: index('ai_assets_sources_url_idx').on(table.url),
    nameUrlUniqueIdx: uniqueIndex('ai_assets_sources_name_url_uq').on(table.name, table.url),
  })
);

export const aiAssetSourceLinks = aiAssetsMarketplace.table(
  'source_links',
  {
    id: integer('id').primaryKey(),
    sourceId: integer('source_id').notNull(),
    linkUrl: text('link_url').notNull(),
    anchor: text('anchor'),
  },
  (table) => ({
    sourceIdx: index('ai_assets_source_links_source_id_idx').on(table.sourceId),
    linkUrlIdx: index('ai_assets_source_links_link_url_idx').on(table.linkUrl),
    sourceUrlUniqueIdx: uniqueIndex('ai_assets_source_links_source_url_uq').on(
      table.sourceId,
      table.linkUrl
    ),
  })
);

export const aiAssetPrompts = aiAssetsMarketplace.table(
  'prompts',
  {
    id: integer('id').primaryKey(),
    sourceId: integer('source_id').notNull(),
    title: text('title'),
    promptText: text('prompt_text').notNull(),
    promptHash: varchar('prompt_hash', { length: 128 }).notNull(),
    url: text('url'),
    license: text('license'),
    tags: text('tags'),
    createdAt: text('created_at'),
  },
  (table) => ({
    sourceIdx: index('ai_assets_prompts_source_id_idx').on(table.sourceId),
    promptHashIdx: index('ai_assets_prompts_prompt_hash_idx').on(table.promptHash),
    sourceHashUniqueIdx: uniqueIndex('ai_assets_prompts_source_hash_uq').on(
      table.sourceId,
      table.promptHash
    ),
  })
);

export const aiAssetArtifacts = aiAssetsMarketplace.table('artifacts', {
  filename: text('filename').primaryKey(),
  contentType: text('content_type').notNull(),
  contentText: text('content_text'),
  // Stored as base64/text at the ORM layer for compatibility with current Drizzle version.
  contentBytea: text('content_bytea'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiAssetCrawlRuns = aiAssetsMarketplace.table(
  'crawl_runs',
  {
    id: text('id').primaryKey(),
    status: varchar('status', { length: 32 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    stats: jsonb('stats'),
    error: text('error'),
  },
  (table) => ({
    statusIdx: index('ai_assets_crawl_runs_status_idx').on(table.status),
    startedAtIdx: index('ai_assets_crawl_runs_started_at_idx').on(table.startedAt),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const aiAssetCategoriesRelations = relations(aiAssetCategories, ({ many }) => ({
  sources: many(aiAssetSources),
}));

export const aiAssetSourcesRelations = relations(aiAssetSources, ({ one, many }) => ({
  category: one(aiAssetCategories, {
    fields: [aiAssetSources.categoryId],
    references: [aiAssetCategories.id],
  }),
  links: many(aiAssetSourceLinks),
  prompts: many(aiAssetPrompts),
}));

export const aiAssetSourceLinksRelations = relations(aiAssetSourceLinks, ({ one }) => ({
  source: one(aiAssetSources, {
    fields: [aiAssetSourceLinks.sourceId],
    references: [aiAssetSources.id],
  }),
}));

export const aiAssetPromptsRelations = relations(aiAssetPrompts, ({ one }) => ({
  source: one(aiAssetSources, {
    fields: [aiAssetPrompts.sourceId],
    references: [aiAssetSources.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================

export type AiAssetCategory = typeof aiAssetCategories.$inferSelect;
export type NewAiAssetCategory = typeof aiAssetCategories.$inferInsert;
export type AiAssetSource = typeof aiAssetSources.$inferSelect;
export type NewAiAssetSource = typeof aiAssetSources.$inferInsert;
export type AiAssetSourceLink = typeof aiAssetSourceLinks.$inferSelect;
export type NewAiAssetSourceLink = typeof aiAssetSourceLinks.$inferInsert;
export type AiAssetPrompt = typeof aiAssetPrompts.$inferSelect;
export type NewAiAssetPrompt = typeof aiAssetPrompts.$inferInsert;
export type AiAssetArtifact = typeof aiAssetArtifacts.$inferSelect;
export type NewAiAssetArtifact = typeof aiAssetArtifacts.$inferInsert;
export type AiAssetCrawlRun = typeof aiAssetCrawlRuns.$inferSelect;
export type NewAiAssetCrawlRun = typeof aiAssetCrawlRuns.$inferInsert;
