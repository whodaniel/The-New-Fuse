"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceOffersRelations = exports.marketplaceListingsRelations = exports.revenueDistributionsRelations = exports.revenueStreamsRelations = exports.fractionalSharesRelations = exports.marketplaceCatalogItems = exports.marketplaceOffers = exports.marketplaceListings = exports.revenueDistributions = exports.revenueStreams = exports.fractionalShares = void 0;
/**
 * Drizzle ORM Schema - NFT & Marketplace System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
// =============================================================================
// FRACTIONAL SHARE
// =============================================================================
exports.fractionalShares = (0, pg_core_1.pgTable)('fractional_shares', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentNFTId: (0, pg_core_1.uuid)('agent_nft_id')
        .notNull()
        .references(() => agents_1.agentNfts.id, { onDelete: 'cascade' }),
    ownerAddress: (0, pg_core_1.varchar)('owner_address', { length: 100 }).notNull(),
    shareAmount: (0, pg_core_1.decimal)('share_amount', { precision: 38, scale: 18 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// REVENUE STREAM
// =============================================================================
exports.revenueStreams = (0, pg_core_1.pgTable)('revenue_streams', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentNFTId: (0, pg_core_1.uuid)('agent_nft_id')
        .notNull()
        .references(() => agents_1.agentNfts.id, { onDelete: 'cascade' }),
    streamName: (0, pg_core_1.varchar)('stream_name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    tokenAddress: (0, pg_core_1.varchar)('token_address', { length: 100 }).notNull(),
    totalRevenue: (0, pg_core_1.decimal)('total_revenue', { precision: 38, scale: 18 }).notNull(),
    distributedRevenue: (0, pg_core_1.decimal)('distributed_revenue', { precision: 38, scale: 18 }).notNull(),
    distributionThreshold: (0, pg_core_1.decimal)('distribution_threshold', { precision: 38, scale: 18 }).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// REVENUE DISTRIBUTION
// =============================================================================
exports.revenueDistributions = (0, pg_core_1.pgTable)('revenue_distributions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    revenueStreamId: (0, pg_core_1.uuid)('revenue_stream_id')
        .notNull()
        .references(() => exports.revenueStreams.id, { onDelete: 'cascade' }),
    txHash: (0, pg_core_1.varchar)('tx_hash', { length: 100 }).notNull(),
    totalAmount: (0, pg_core_1.decimal)('total_amount', { precision: 38, scale: 18 }).notNull(),
    distributedTo: (0, pg_core_1.jsonb)('distributed_to').notNull(),
    blockNumber: (0, pg_core_1.integer)('block_number').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// MARKETPLACE LISTING
// =============================================================================
exports.marketplaceListings = (0, pg_core_1.pgTable)('marketplace_listings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentNFTId: (0, pg_core_1.uuid)('agent_nft_id')
        .notNull()
        .references(() => agents_1.agentNfts.id, { onDelete: 'cascade' }),
    listingId: (0, pg_core_1.integer)('listing_id').unique().notNull(),
    seller: (0, pg_core_1.varchar)('seller', { length: 100 }).notNull(),
    shareAmount: (0, pg_core_1.decimal)('share_amount', { precision: 38, scale: 18 }).notNull(),
    pricePerShare: (0, pg_core_1.decimal)('price_per_share', { precision: 38, scale: 18 }).notNull(),
    totalPrice: (0, pg_core_1.decimal)('total_price', { precision: 38, scale: 18 }).notNull(),
    status: (0, enums_1.marketplaceStatusEnum)('status').default('ACTIVE').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// MARKETPLACE OFFER
// =============================================================================
exports.marketplaceOffers = (0, pg_core_1.pgTable)('marketplace_offers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    listingId: (0, pg_core_1.uuid)('listing_id')
        .notNull()
        .references(() => exports.marketplaceListings.id, { onDelete: 'cascade' }),
    buyer: (0, pg_core_1.varchar)('buyer', { length: 100 }).notNull(),
    shareAmount: (0, pg_core_1.decimal)('share_amount', { precision: 38, scale: 18 }).notNull(),
    offerPrice: (0, pg_core_1.decimal)('offer_price', { precision: 38, scale: 18 }).notNull(),
    status: (0, enums_1.offerStatusEnum)('status').default('PENDING').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// MARKETPLACE CATALOG ITEM (TNF APP MARKETPLACE)
// =============================================================================
exports.marketplaceCatalogItems = (0, pg_core_1.pgTable)('marketplace_catalog_items', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    slug: (0, pg_core_1.text)('slug').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    kind: (0, pg_core_1.varchar)('kind', { length: 40 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 120 }).notNull(),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    capabilities: (0, pg_core_1.jsonb)('capabilities').$type().default([]).notNull(),
    rating: (0, pg_core_1.real)('rating').default(0).notNull(),
    totalRuns: (0, pg_core_1.integer)('total_runs').default(0).notNull(),
    successRate: (0, pg_core_1.real)('success_rate').default(0).notNull(),
    pricePerRun: (0, pg_core_1.real)('price_per_run').default(0).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('online').notNull(),
    publicationStatus: (0, pg_core_1.varchar)('publication_status', { length: 20 }).default('draft').notNull(),
    launchUrl: (0, pg_core_1.text)('launch_url'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    createdBy: (0, pg_core_1.text)('created_by'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    slugUniqueIdx: (0, pg_core_1.uniqueIndex)('marketplace_catalog_items_slug_uq').on(table.slug),
    kindIdx: (0, pg_core_1.index)('marketplace_catalog_items_kind_idx').on(table.kind),
    publicationIdx: (0, pg_core_1.index)('marketplace_catalog_items_publication_idx').on(table.publicationStatus),
    updatedAtIdx: (0, pg_core_1.index)('marketplace_catalog_items_updated_at_idx').on(table.updatedAt),
}));
// =============================================================================
// RELATIONS
// =============================================================================
exports.fractionalSharesRelations = (0, drizzle_orm_1.relations)(exports.fractionalShares, ({ one }) => ({
    agentNft: one(agents_1.agentNfts, {
        fields: [exports.fractionalShares.agentNFTId],
        references: [agents_1.agentNfts.id],
    }),
}));
exports.revenueStreamsRelations = (0, drizzle_orm_1.relations)(exports.revenueStreams, ({ one, many }) => ({
    agentNft: one(agents_1.agentNfts, {
        fields: [exports.revenueStreams.agentNFTId],
        references: [agents_1.agentNfts.id],
    }),
    distributions: many(exports.revenueDistributions),
}));
exports.revenueDistributionsRelations = (0, drizzle_orm_1.relations)(exports.revenueDistributions, ({ one }) => ({
    revenueStream: one(exports.revenueStreams, {
        fields: [exports.revenueDistributions.revenueStreamId],
        references: [exports.revenueStreams.id],
    }),
}));
exports.marketplaceListingsRelations = (0, drizzle_orm_1.relations)(exports.marketplaceListings, ({ one, many }) => ({
    agentNft: one(agents_1.agentNfts, {
        fields: [exports.marketplaceListings.agentNFTId],
        references: [agents_1.agentNfts.id],
    }),
    offers: many(exports.marketplaceOffers),
}));
exports.marketplaceOffersRelations = (0, drizzle_orm_1.relations)(exports.marketplaceOffers, ({ one }) => ({
    listing: one(exports.marketplaceListings, {
        fields: [exports.marketplaceOffers.listingId],
        references: [exports.marketplaceListings.id],
    }),
}));
//# sourceMappingURL=marketplace.js.map