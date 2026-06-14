import { Resource, ResourceVisibility } from '../types/index.js';
export interface AccessContext {
    userId?: string;
    agentId?: string;
    isAgent: boolean;
    isAdmin: boolean;
    roles?: string[];
}
export declare class ResourceAccessControlService {
    private readonly logger;
    /**
     * Check if accessor can view a resource
     */
    canView(resource: Resource, context: AccessContext): boolean;
    /**
     * Check if accessor can modify a resource
     */
    canModify(resource: Resource, context: AccessContext): boolean;
    /**
     * Check if accessor can delete a resource
     */
    canDelete(resource: Resource, context: AccessContext): boolean;
    /**
     * Check if accessor can execute/download a resource
     */
    canExecute(resource: Resource, context: AccessContext): boolean;
    /**
     * Assert that accessor can execute/download a resource (throws if not allowed)
     */
    assertCanExecute(resource: Resource, context: AccessContext): void;
    /**
     * Assert that accessor can view a resource (throws if not allowed)
     */
    assertCanView(resource: Resource, context: AccessContext): void;
    /**
     * Assert that accessor can modify a resource (throws if not allowed)
     */
    assertCanModify(resource: Resource, context: AccessContext): void;
    /**
     * Assert that accessor can delete a resource (throws if not allowed)
     */
    assertCanDelete(resource: Resource, context: AccessContext): void;
    /**
     * Filter resources based on access permissions
     */
    filterByAccess(resources: Resource[], context: AccessContext): Resource[];
    /**
     * Get visibility options available to accessor
     */
    getAvailableVisibilities(context: AccessContext): ResourceVisibility[];
    private isOwner;
}
//# sourceMappingURL=resource-access-control.service.d.ts.map