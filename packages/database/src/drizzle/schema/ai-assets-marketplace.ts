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

export const aiAssetSkillMarketplaceEntries = aiAssetsMarketplace.table(
  'skill_marketplace_entries',
  {
    id: integer('id').primaryKey(),
    source: text('source').notNull(),
    entryUrl: text('entry_url').notNull(),
    title: text('title'),
    brief: text('brief'),
    tags: text('tags'),
    discoveredAt: text('discovered_at'),
  },
  (table) => ({
    sourceIdx: index('ai_assets_skill_marketplace_entries_source_idx').on(table.source),
    sourceEntryUrlUniqueIdx: uniqueIndex('ai_assets_skill_marketplace_entries_source_url_uq').on(
      table.source,
      table.entryUrl
    ),
  })
);

export const aiAssetMcpCategories = aiAssetsMarketplace.table(
  'mcp_categories',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex('ai_assets_mcp_categories_name_uq').on(table.name),
  })
);

export const aiAssetMcpSources = aiAssetsMarketplace.table(
  'mcp_sources',
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
    categoryIdx: index('ai_assets_mcp_sources_category_id_idx').on(table.categoryId),
    urlIdx: index('ai_assets_mcp_sources_url_idx').on(table.url),
    nameUrlUniqueIdx: uniqueIndex('ai_assets_mcp_sources_name_url_uq').on(table.name, table.url),
  })
);

export const aiAssetMcpLinks = aiAssetsMarketplace.table(
  'mcp_links',
  {
    id: integer('id').primaryKey(),
    sourceId: integer('source_id').notNull(),
    linkUrl: text('link_url').notNull(),
    anchor: text('anchor'),
  },
  (table) => ({
    sourceIdx: index('ai_assets_mcp_links_source_id_idx').on(table.sourceId),
    linkUrlIdx: index('ai_assets_mcp_links_link_url_idx').on(table.linkUrl),
    sourceUrlUniqueIdx: uniqueIndex('ai_assets_mcp_links_source_url_uq').on(
      table.sourceId,
      table.linkUrl
    ),
  })
);

export const aiAssetMcpServers = aiAssetsMarketplace.table(
  'mcp_servers',
  {
    id: integer('id').primaryKey(),
    sourceId: integer('source_id'),
    serverName: text('server_name').notNull(),
    serverUrl: text('server_url'),
    repoUrl: text('repo_url'),
    description: text('description'),
    tags: text('tags'),
    maintainer: text('maintainer'),
    stars: integer('stars'),
    license: text('license'),
    transport: text('transport'),
    createdAt: text('created_at'),
  },
  (table) => ({
    sourceIdx: index('ai_assets_mcp_servers_source_id_idx').on(table.sourceId),
    serverUrlIdx: index('ai_assets_mcp_servers_server_url_idx').on(table.serverUrl),
    repoUrlIdx: index('ai_assets_mcp_servers_repo_url_idx').on(table.repoUrl),
    serverRepoUniqueIdx: uniqueIndex('ai_assets_mcp_servers_server_repo_uq').on(
      table.serverUrl,
      table.repoUrl
    ),
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
export type AiAssetSkillMarketplaceEntry = typeof aiAssetSkillMarketplaceEntries.$inferSelect;
export type NewAiAssetSkillMarketplaceEntry = typeof aiAssetSkillMarketplaceEntries.$inferInsert;
export type AiAssetMcpCategory = typeof aiAssetMcpCategories.$inferSelect;
export type NewAiAssetMcpCategory = typeof aiAssetMcpCategories.$inferInsert;
export type AiAssetMcpSource = typeof aiAssetMcpSources.$inferSelect;
export type NewAiAssetMcpSource = typeof aiAssetMcpSources.$inferInsert;
export type AiAssetMcpLink = typeof aiAssetMcpLinks.$inferSelect;
export type NewAiAssetMcpLink = typeof aiAssetMcpLinks.$inferInsert;
export type AiAssetMcpServer = typeof aiAssetMcpServers.$inferSelect;
export type NewAiAssetMcpServer = typeof aiAssetMcpServers.$inferInsert;
