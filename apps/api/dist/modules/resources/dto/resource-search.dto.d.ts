import type { ResourceCatalogItem, ResourceCategoryFilter, ResourceSearchEnvelope, ResourceSearchMeta, ResourceSearchRequest, ResourceSortBy, ResourceTypeFilter, TraitConfidence } from '@the-new-fuse/types';
export declare class ResourceSearchRequestDto implements ResourceSearchRequest {
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
export declare class ResourceSearchMetaDto implements ResourceSearchMeta {
    enabled: boolean;
    used: boolean;
    confidence: TraitConfidence | null;
    traitFilters: string[];
    requiredAgentIds: string[];
    fallbackToBroadSearch: boolean;
    beforeTraitCount: number;
    afterTraitCount: number;
}
export declare class ResourceDto implements ResourceCatalogItem {
    [key: string]: unknown;
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
}
export declare class ResourceSearchEnvelopeDto implements ResourceSearchEnvelope<ResourceDto> {
    items: ResourceDto[];
    traitScreen?: ResourceSearchMetaDto;
}
//# sourceMappingURL=resource-search.dto.d.ts.map