export type MarketplaceKind =
  | 'experience'
  | 'workflow'
  | 'mcp_server'
  | 'skill'
  | 'prompt'
  | 'agent_template'
  | 'agent'
  | 'model';

export type MarketplacePublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export interface MarketplaceCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: MarketplaceKind;
  category: string;
  tags: string[];
  capabilities: string[];
  rating: number;
  totalRuns: number;
  successRate: number;
  pricePerRun: number;
  status: 'online' | 'busy' | 'offline';
  publicationStatus: MarketplacePublicationStatus;
  launchUrl?: string;
  avatarUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCatalogQuery {
  kind?: MarketplaceKind;
  category?: string;
  status?: MarketplacePublicationStatus;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface MarketplaceExperienceSubmissionInput {
  name: string;
  description: string;
  category: string;
  launchUrl?: string;
  tags?: string[];
  createdBy?: string;
}

export interface MarketplaceCatalogSubmissionInput extends MarketplaceExperienceSubmissionInput {
  kind: MarketplaceKind;
  capabilities?: string[];
}
