export type ResourceSortBy = 'popular' | 'recent' | 'rating' | 'name';

export type ResourceTypeFilter = 'skill' | 'workflow' | 'template' | 'tool' | 'integration' | 'all';

export type ResourceCategoryFilter =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'data'
  | 'automation'
  | 'ai'
  | 'other'
  | 'all';

export type TraitConfidence = 'high' | 'medium' | 'low';

export interface ResourceSearchRequest {
  search?: string;
  type?: ResourceTypeFilter;
  category?: ResourceCategoryFilter;
  tags?: string[];
  featured?: boolean;
  sortBy?: ResourceSortBy;
  traitScreen?: boolean;
  traitLimit?: number;
  traitThreshold?: number;
  includeTraitMeta?: boolean;
}

export interface ResourceSearchMeta {
  enabled: boolean;
  used: boolean;
  confidence: TraitConfidence | null;
  traitFilters: string[];
  requiredAgentIds: string[];
  fallbackToBroadSearch: boolean;
  beforeTraitCount: number;
  afterTraitCount: number;
}

export interface ResourceCatalogItem {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  previewImage?: string;
  [key: string]: unknown;
}

export interface ResourceSearchEnvelope<
  TResource extends ResourceCatalogItem = ResourceCatalogItem,
> {
  items: TResource[];
  traitScreen?: ResourceSearchMeta;
}

export type ResourceSearchResponse<TResource extends ResourceCatalogItem = ResourceCatalogItem> =
  | TResource[]
  | ResourceSearchEnvelope<TResource>;
