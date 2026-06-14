import { ResourceCategory, ResourceStatus, ResourceType, ResourceVisibility } from '../types/index.js';
export declare class SearchResourceDto {
    query?: string;
    category?: ResourceCategory[];
    type?: ResourceType[];
    visibility?: ResourceVisibility[];
    status?: ResourceStatus[];
    tags?: string[];
    keywords?: string[];
    author?: string;
    authorId?: string;
    isVerified?: boolean;
    isFeatured?: boolean;
    minVersion?: string;
    maxVersion?: string;
    createdAfter?: string;
    createdBefore?: string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'downloadCount' | 'favoriteCount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=search-resource.dto.d.ts.map