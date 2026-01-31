/**
 * Drizzle ORM Schema - Unified AI Asset Marketplace
 * Implements the architecture from docs/UNIFIED_MARKETPLACE_ARCHITECTURE.md
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agentNfts } from './agents';
import { promptTemplates } from './prompt-templates';
import { users } from './users';

// Enums
export const assetTypeEnum = pgEnum('asset_type', [
  'MCP_SERVER',
  'SKILL',
  'PROMPT',
  'PROMPT_PACK',
  'AGENT',
]);

export const pricingTypeEnum = pgEnum('pricing_type', [
  'FREE',
  'ONE_TIME',
  'SUBSCRIPTION',
  'PAY_PER_USE',
  'REVENUE_SHARE',
]);

// =============================================================================
// MARKETPLACE ASSETS (Base Table)
// =============================================================================

export const marketplaceAssets = pgTable('marketplace_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assetTypeEnum('type').notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),

  // Metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  version: varchar('version', { length: 50 }).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  category: varchar('category', { length: 100 }),

  // Media
  iconUrl: text('icon_url'),
  bannerUrl: text('banner_url'),
  screenshots: jsonb('screenshots').$type<string[]>().default([]),

  // Stats & Trust
  trustScore: integer('trust_score').default(0),
  communityRating: decimal('community_rating', { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer('review_count').default(0),
  downloadCount: integer('download_count').default(0),
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),

  // Pricing
  pricingType: pricingTypeEnum('pricing_type').default('FREE').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }), // USD
  currency: varchar('currency', { length: 10 }).default('USD'),

  // Relations to specific implementations
  promptTemplateId: uuid('prompt_template_id').references(() => promptTemplates.id),
  agentNftId: uuid('agent_nft_id').references(() => agentNfts.id),

  // Creator
  authorId: uuid('author_id')
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
});

// =============================================================================
// SKILL DEFINITIONS (New Table)
// =============================================================================

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => marketplaceAssets.id, { onDelete: 'cascade' }),

  // Content (references the .md content or structured definition)
  content: text('content'),
  parameters: jsonb('parameters').$type<Record<string, any>>().default({}),
  requiredTools: jsonb('required_tools').$type<string[]>().default([]),

  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT PACKS (New Table)
// =============================================================================

export const promptPacks = pgTable('prompt_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => marketplaceAssets.id, { onDelete: 'cascade' }),

  theme: varchar('theme', { length: 100 }),
  prompts: jsonb('prompts').$type<string[]>().default([]), // Array of prompt IDs

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const marketplaceAssetsRelations = relations(marketplaceAssets, ({ one, many }) => ({
  author: one(users, {
    fields: [marketplaceAssets.authorId],
    references: [users.id],
  }),
  // If it's a prompt
  promptTemplate: one(promptTemplates, {
    fields: [marketplaceAssets.promptTemplateId],
    references: [promptTemplates.id],
  }),
  // If it's an agent
  agentNft: one(agentNfts, {
    fields: [marketplaceAssets.agentNftId],
    references: [agentNfts.id],
  }),
  skill: one(skills, {
    fields: [marketplaceAssets.id],
    references: [skills.assetId],
  }),
}));
