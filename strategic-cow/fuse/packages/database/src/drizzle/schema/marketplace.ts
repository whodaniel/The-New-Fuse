/**
 * Drizzle ORM Schema - NFT & Marketplace System
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agentNfts } from './agents';
import { marketplaceStatusEnum, offerStatusEnum } from './enums';

// =============================================================================
// FRACTIONAL SHARE
// =============================================================================

export const fractionalShares = pgTable('fractional_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentNFTId: uuid('agent_nft_id')
    .notNull()
    .references(() => agentNfts.id, { onDelete: 'cascade' }),
  ownerAddress: varchar('owner_address', { length: 100 }).notNull(),
  shareAmount: decimal('share_amount', { precision: 38, scale: 18 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// REVENUE STREAM
// =============================================================================

export const revenueStreams = pgTable('revenue_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentNFTId: uuid('agent_nft_id')
    .notNull()
    .references(() => agentNfts.id, { onDelete: 'cascade' }),
  streamName: varchar('stream_name', { length: 255 }).notNull(),
  description: text('description'),
  tokenAddress: varchar('token_address', { length: 100 }).notNull(),
  totalRevenue: decimal('total_revenue', { precision: 38, scale: 18 }).notNull(),
  distributedRevenue: decimal('distributed_revenue', { precision: 38, scale: 18 }).notNull(),
  distributionThreshold: decimal('distribution_threshold', { precision: 38, scale: 18 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// REVENUE DISTRIBUTION
// =============================================================================

export const revenueDistributions = pgTable('revenue_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  revenueStreamId: uuid('revenue_stream_id')
    .notNull()
    .references(() => revenueStreams.id, { onDelete: 'cascade' }),
  txHash: varchar('tx_hash', { length: 100 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 38, scale: 18 }).notNull(),
  distributedTo: jsonb('distributed_to').notNull(),
  blockNumber: integer('block_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// MARKETPLACE LISTING
// =============================================================================

export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentNFTId: uuid('agent_nft_id')
    .notNull()
    .references(() => agentNfts.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').unique().notNull(),
  seller: varchar('seller', { length: 100 }).notNull(),
  shareAmount: decimal('share_amount', { precision: 38, scale: 18 }).notNull(),
  pricePerShare: decimal('price_per_share', { precision: 38, scale: 18 }).notNull(),
  totalPrice: decimal('total_price', { precision: 38, scale: 18 }).notNull(),
  status: marketplaceStatusEnum('status').default('ACTIVE').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// MARKETPLACE OFFER
// =============================================================================

export const marketplaceOffers = pgTable('marketplace_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => marketplaceListings.id, { onDelete: 'cascade' }),
  buyer: varchar('buyer', { length: 100 }).notNull(),
  shareAmount: decimal('share_amount', { precision: 38, scale: 18 }).notNull(),
  offerPrice: decimal('offer_price', { precision: 38, scale: 18 }).notNull(),
  status: offerStatusEnum('status').default('PENDING').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const fractionalSharesRelations = relations(fractionalShares, ({ one }) => ({
  agentNft: one(agentNfts, {
    fields: [fractionalShares.agentNFTId],
    references: [agentNfts.id],
  }),
}));

export const revenueStreamsRelations = relations(revenueStreams, ({ one, many }) => ({
  agentNft: one(agentNfts, {
    fields: [revenueStreams.agentNFTId],
    references: [agentNfts.id],
  }),
  distributions: many(revenueDistributions),
}));

export const revenueDistributionsRelations = relations(revenueDistributions, ({ one }) => ({
  revenueStream: one(revenueStreams, {
    fields: [revenueDistributions.revenueStreamId],
    references: [revenueStreams.id],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  agentNft: one(agentNfts, {
    fields: [marketplaceListings.agentNFTId],
    references: [agentNfts.id],
  }),
  offers: many(marketplaceOffers),
}));

export const marketplaceOffersRelations = relations(marketplaceOffers, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceOffers.listingId],
    references: [marketplaceListings.id],
  }),
}));
