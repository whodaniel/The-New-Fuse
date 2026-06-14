import { ResourceCategory, ResourceStatus, ResourceType, ResourceVisibility } from '../types/index.js';
export declare class UpdateResourceDto {
    name?: string;
    description?: string;
    category?: ResourceCategory;
    type?: ResourceType;
    content?: any;
    tags?: string[];
    version?: string;
    source?: string;
    visibility?: ResourceVisibility;
    author?: string;
    authorId?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    status?: ResourceStatus;
    isVerified?: boolean;
    isFeatured?: boolean;
    dependencies?: string[];
    relatedResources?: string[];
    metadata?: {
        performanceMetrics?: any;
        qualityScore?: number;
        complexityScore?: number;
        estimatedExecutionTime?: number;
        requiredDependencies?: string[];
        optionalDependencies?: string[];
        minimumNodeVersion?: string;
        platforms?: string[];
        configSchema?: any;
    };
}
//# sourceMappingURL=update-resource.dto.d.ts.map