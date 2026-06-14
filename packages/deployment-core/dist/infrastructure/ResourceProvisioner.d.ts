/**
 * Resource Provisioner
 * Handles provisioning, updating, and destroying infrastructure resources
 */
import { ResourceDefinition, ResourceProvisionResult, InfrastructureChange, InfrastructureState, ResourceType, CloudProvider, ResourceState } from '../types/infrastructure.js';
import { InfrastructureImportConfig } from '../interfaces/IInfrastructureManager.js';
export interface ResourceProvider {
    provision(resource: ResourceDefinition, infrastructureId: string): Promise<ResourceProvisionResult>;
    update(resource: ResourceDefinition, change: InfrastructureChange, infrastructureId: string): Promise<ResourceProvisionResult>;
    destroy(resource: ResourceDefinition, infrastructureId: string): Promise<ResourceProvisionResult>;
    import(importConfig: ResourceImportConfig): Promise<ResourceProvisionResult>;
    getStatus(resourceId: string): Promise<ResourceStatus>;
    refresh(resource: ResourceDefinition): Promise<ResourceDefinition>;
}
export interface ResourceImportConfig {
    resourceId: string;
    resourceType: ResourceType;
    provider: CloudProvider;
    region: string;
    tags?: Record<string, string>;
}
export interface ResourceStatus {
    id: string;
    state: ResourceState;
    health: ResourceHealth;
    properties: Record<string, any>;
    outputs: Record<string, any>;
    lastUpdated: Date;
}
export declare enum ResourceHealth {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy",
    UNKNOWN = "unknown"
}
export declare class ResourceProvisioner {
    private providers;
    private provisioningQueue;
    constructor();
    provisionResources(resources: ResourceDefinition[], infrastructureId: string): Promise<ResourceProvisionResult[]>;
    destroyResources(resources: any[], infrastructureId: string): Promise<ResourceProvisionResult[]>;
    applyChange(change: InfrastructureChange, infrastructureId: string): Promise<ResourceProvisionResult>;
    importResources(importConfig: InfrastructureImportConfig): Promise<ResourceProvisionResult[]>;
    refreshResourceStates(state: InfrastructureState): Promise<InfrastructureState>;
    private provisionResource;
    private updateResource;
    private destroyResource;
    private importResource;
    private getProvider;
    private sortResourcesByDependencies;
    private groupResourcesByDependencyLevel;
    private isCriticalResource;
    private convertStateToDefinition;
    private initializeProviders;
}
//# sourceMappingURL=ResourceProvisioner.d.ts.map