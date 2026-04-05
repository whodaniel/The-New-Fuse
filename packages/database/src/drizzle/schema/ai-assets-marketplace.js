"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAssetPromptsRelations = exports.aiAssetSourceLinksRelations = exports.aiAssetSourcesRelations = exports.aiAssetCategoriesRelations = exports.aiAssetMcpServers = exports.aiAssetMcpLinks = exports.aiAssetMcpSources = exports.aiAssetMcpCategories = exports.aiAssetSkillMarketplaceEntries = exports.aiAssetCrawlRuns = exports.aiAssetArtifacts = exports.aiAssetPrompts = exports.aiAssetSourceLinks = exports.aiAssetSources = exports.aiAssetCategories = exports.aiAssetsMarketplace = void 0;
/**
 * Drizzle ORM Schema - AI Assets Marketplace (Crawl4AI Ingestion)
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.aiAssetsMarketplace = (0, pg_core_1.pgSchema)('ai_assets_marketplace');
// =============================================================================
// INGESTION TABLES
// =============================================================================
exports.aiAssetCategories = exports.aiAssetsMarketplace.table('categories', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
}, (table) => ({
    nameUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_categories_name_uq').on(table.name),
}));
exports.aiAssetSources = exports.aiAssetsMarketplace.table('sources', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    categoryId: (0, pg_core_1.integer)('category_id').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    url: (0, pg_core_1.text)('url').notNull(),
    title: (0, pg_core_1.text)('title'),
    brief: (0, pg_core_1.text)('brief'),
    sourceType: (0, pg_core_1.varchar)('source_type', { length: 80 }),
    createdAt: (0, pg_core_1.text)('created_at'),
    updatedAt: (0, pg_core_1.text)('updated_at'),
}, (table) => ({
    categoryIdx: (0, pg_core_1.index)('ai_assets_sources_category_id_idx').on(table.categoryId),
    urlIdx: (0, pg_core_1.index)('ai_assets_sources_url_idx').on(table.url),
    nameUrlUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_sources_name_url_uq').on(table.name, table.url),
}));
exports.aiAssetSourceLinks = exports.aiAssetsMarketplace.table('source_links', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    sourceId: (0, pg_core_1.integer)('source_id').notNull(),
    linkUrl: (0, pg_core_1.text)('link_url').notNull(),
    anchor: (0, pg_core_1.text)('anchor'),
}, (table) => ({
    sourceIdx: (0, pg_core_1.index)('ai_assets_source_links_source_id_idx').on(table.sourceId),
    linkUrlIdx: (0, pg_core_1.index)('ai_assets_source_links_link_url_idx').on(table.linkUrl),
    sourceUrlUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_source_links_source_url_uq').on(table.sourceId, table.linkUrl),
}));
exports.aiAssetPrompts = exports.aiAssetsMarketplace.table('prompts', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    sourceId: (0, pg_core_1.integer)('source_id').notNull(),
    title: (0, pg_core_1.text)('title'),
    promptText: (0, pg_core_1.text)('prompt_text').notNull(),
    promptHash: (0, pg_core_1.varchar)('prompt_hash', { length: 128 }).notNull(),
    url: (0, pg_core_1.text)('url'),
    license: (0, pg_core_1.text)('license'),
    tags: (0, pg_core_1.text)('tags'),
    createdAt: (0, pg_core_1.text)('created_at'),
}, (table) => ({
    sourceIdx: (0, pg_core_1.index)('ai_assets_prompts_source_id_idx').on(table.sourceId),
    promptHashIdx: (0, pg_core_1.index)('ai_assets_prompts_prompt_hash_idx').on(table.promptHash),
    sourceHashUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_prompts_source_hash_uq').on(table.sourceId, table.promptHash),
}));
exports.aiAssetArtifacts = exports.aiAssetsMarketplace.table('artifacts', {
    filename: (0, pg_core_1.text)('filename').primaryKey(),
    contentType: (0, pg_core_1.text)('content_type').notNull(),
    contentText: (0, pg_core_1.text)('content_text'),
    // Stored as base64/text at the ORM layer for compatibility with current Drizzle version.
    contentBytea: (0, pg_core_1.text)('content_bytea'),
    uploadedAt: (0, pg_core_1.timestamp)('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.aiAssetCrawlRuns = exports.aiAssetsMarketplace.table('crawl_runs', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    status: (0, pg_core_1.varchar)('status', { length: 32 }).notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: (0, pg_core_1.timestamp)('finished_at', { withTimezone: true }),
    stats: (0, pg_core_1.jsonb)('stats'),
    error: (0, pg_core_1.text)('error'),
}, (table) => ({
    statusIdx: (0, pg_core_1.index)('ai_assets_crawl_runs_status_idx').on(table.status),
    startedAtIdx: (0, pg_core_1.index)('ai_assets_crawl_runs_started_at_idx').on(table.startedAt),
}));
exports.aiAssetSkillMarketplaceEntries = exports.aiAssetsMarketplace.table('skill_marketplace_entries', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    source: (0, pg_core_1.text)('source').notNull(),
    entryUrl: (0, pg_core_1.text)('entry_url').notNull(),
    title: (0, pg_core_1.text)('title'),
    brief: (0, pg_core_1.text)('brief'),
    tags: (0, pg_core_1.text)('tags'),
    discoveredAt: (0, pg_core_1.text)('discovered_at'),
}, (table) => ({
    sourceIdx: (0, pg_core_1.index)('ai_assets_skill_marketplace_entries_source_idx').on(table.source),
    sourceEntryUrlUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_skill_marketplace_entries_source_url_uq').on(table.source, table.entryUrl),
}));
exports.aiAssetMcpCategories = exports.aiAssetsMarketplace.table('mcp_categories', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
}, (table) => ({
    nameUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_mcp_categories_name_uq').on(table.name),
}));
exports.aiAssetMcpSources = exports.aiAssetsMarketplace.table('mcp_sources', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    categoryId: (0, pg_core_1.integer)('category_id').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    url: (0, pg_core_1.text)('url').notNull(),
    title: (0, pg_core_1.text)('title'),
    brief: (0, pg_core_1.text)('brief'),
    sourceType: (0, pg_core_1.varchar)('source_type', { length: 80 }),
    createdAt: (0, pg_core_1.text)('created_at'),
    updatedAt: (0, pg_core_1.text)('updated_at'),
}, (table) => ({
    categoryIdx: (0, pg_core_1.index)('ai_assets_mcp_sources_category_id_idx').on(table.categoryId),
    urlIdx: (0, pg_core_1.index)('ai_assets_mcp_sources_url_idx').on(table.url),
    nameUrlUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_mcp_sources_name_url_uq').on(table.name, table.url),
}));
exports.aiAssetMcpLinks = exports.aiAssetsMarketplace.table('mcp_links', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    sourceId: (0, pg_core_1.integer)('source_id').notNull(),
    linkUrl: (0, pg_core_1.text)('link_url').notNull(),
    anchor: (0, pg_core_1.text)('anchor'),
}, (table) => ({
    sourceIdx: (0, pg_core_1.index)('ai_assets_mcp_links_source_id_idx').on(table.sourceId),
    linkUrlIdx: (0, pg_core_1.index)('ai_assets_mcp_links_link_url_idx').on(table.linkUrl),
    sourceUrlUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_mcp_links_source_url_uq').on(table.sourceId, table.linkUrl),
}));
exports.aiAssetMcpServers = exports.aiAssetsMarketplace.table('mcp_servers', {
    id: (0, pg_core_1.integer)('id').primaryKey(),
    sourceId: (0, pg_core_1.integer)('source_id'),
    serverName: (0, pg_core_1.text)('server_name').notNull(),
    serverUrl: (0, pg_core_1.text)('server_url'),
    repoUrl: (0, pg_core_1.text)('repo_url'),
    description: (0, pg_core_1.text)('description'),
    tags: (0, pg_core_1.text)('tags'),
    maintainer: (0, pg_core_1.text)('maintainer'),
    stars: (0, pg_core_1.integer)('stars'),
    license: (0, pg_core_1.text)('license'),
    transport: (0, pg_core_1.text)('transport'),
    createdAt: (0, pg_core_1.text)('created_at'),
}, (table) => ({
    sourceIdx: (0, pg_core_1.index)('ai_assets_mcp_servers_source_id_idx').on(table.sourceId),
    serverUrlIdx: (0, pg_core_1.index)('ai_assets_mcp_servers_server_url_idx').on(table.serverUrl),
    repoUrlIdx: (0, pg_core_1.index)('ai_assets_mcp_servers_repo_url_idx').on(table.repoUrl),
    serverRepoUniqueIdx: (0, pg_core_1.uniqueIndex)('ai_assets_mcp_servers_server_repo_uq').on(table.serverUrl, table.repoUrl),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.aiAssetCategoriesRelations = (0, drizzle_orm_1.relations)(exports.aiAssetCategories, ({ many }) => ({
    sources: many(exports.aiAssetSources),
}));
exports.aiAssetSourcesRelations = (0, drizzle_orm_1.relations)(exports.aiAssetSources, ({ one, many }) => ({
    category: one(exports.aiAssetCategories, {
        fields: [exports.aiAssetSources.categoryId],
        references: [exports.aiAssetCategories.id],
    }),
    links: many(exports.aiAssetSourceLinks),
    prompts: many(exports.aiAssetPrompts),
}));
exports.aiAssetSourceLinksRelations = (0, drizzle_orm_1.relations)(exports.aiAssetSourceLinks, ({ one }) => ({
    source: one(exports.aiAssetSources, {
        fields: [exports.aiAssetSourceLinks.sourceId],
        references: [exports.aiAssetSources.id],
    }),
}));
exports.aiAssetPromptsRelations = (0, drizzle_orm_1.relations)(exports.aiAssetPrompts, ({ one }) => ({
    source: one(exports.aiAssetSources, {
        fields: [exports.aiAssetPrompts.sourceId],
        references: [exports.aiAssetSources.id],
    }),
}));
//# sourceMappingURL=ai-assets-marketplace.js.map