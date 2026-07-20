import { CreateResourceDto, SearchResourceDto, UpdateResourceDto } from '../dto';
import { ResourceAccessControlService } from '../services/resource-access-control.service.js';
import { ResourceRegistryService } from '../services/resource-registry.service.js';
import { Resource, SearchResult } from '../types/index.js';
/**
 * Resource Registry Controller
 *
 * Manages resource CRUD operations, versioning, and access control.
 * All endpoints require authentication via JWT token or API key.
 *
 * @security ServiceOrUserAuth - Supports both JWT (users) and API key (services)
 * @see ServiceOrUserAuthGuard
 */
export declare class ResourceRegistryController {
    private readonly resourceService;
    private readonly accessControl;
    private readonly logger;
    constructor(resourceService: ResourceRegistryService, accessControl: ResourceAccessControlService);
    /**
     * Create a new resource
     *
     * Creates a new resource in the registry. Requires authentication.
     * Access control is enforced based on user/agent permissions.
     *
     * @requires Authentication
     * @security ServiceOrUserAuth
     */
    create(createDto: CreateResourceDto, request?: any): Promise<Resource>;
    /**
     * Search and list resources
     *
     * Retrieves resources based on search criteria. Results are filtered
     * based on user/agent access permissions.
     *
     * @requires Authentication
     * @security ServiceOrUserAuth
     */
    search(searchDto: SearchResourceDto, request?: any): Promise<SearchResult<Resource>>;
    getCategories(): Promise<string[]>;
    findById(id: string, request?: any): Promise<Resource>;
    update(id: string, updateDto: UpdateResourceDto, request?: any): Promise<Resource>;
    delete(id: string, request?: any): Promise<void>;
    getVersions(id: string, request?: any): Promise<any[]>;
    getVersion(id: string, version: string, request?: any): Promise<any>;
    download(id: string, request?: any): Promise<any>;
    private extractAccessContext;
}
//# sourceMappingURL=resource-registry.controller.d.ts.map