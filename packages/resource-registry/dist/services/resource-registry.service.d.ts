import { CreateResourceDto, SearchResourceDto, UpdateResourceDto } from '../dto';
import { Resource, ResourceAction, SearchResult } from '../types/index.js';
export declare class ResourceRegistryService {
    private readonly logger;
    constructor();
    onModuleDestroy(): Promise<void>;
    /**
     * Create a new resource
     */
    create(dto: CreateResourceDto): Promise<Resource>;
    /**
     * Find resource by ID
     */
    findById(id: string): Promise<Resource>;
    /**
     * Search resources with filters, sorting, and pagination
     */
    search(dto: SearchResourceDto): Promise<SearchResult<Resource>>;
    /**
     * Update a resource
     */
    update(id: string, dto: UpdateResourceDto): Promise<Resource>;
    /**
     * Delete a resource (soft delete)
     */
    delete(id: string): Promise<void>;
    /**
     * Get all categories
     */
    getCategories(): Promise<string[]>;
    /**
     * Log resource access
     */
    logAccess(resourceId: string, action: ResourceAction, accessorId?: string, accessorType?: string, metadata?: any): Promise<void>;
    /**
     * Get resource versions
     */
    getVersions(resourceId: string): Promise<any[]>;
    /**
     * Get specific version
     */
    getVersion(resourceId: string, version: string): Promise<any>;
}
//# sourceMappingURL=resource-registry.service.d.ts.map