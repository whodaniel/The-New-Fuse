/**
 * Google Cloud Platform Provider
 * Handles GCP-specific infrastructure provisioning
 */
import { ResourceProvider, ResourceImportConfig, ResourceStatus } from '../ResourceProvisioner.js';
import { ResourceDefinition, ResourceProvisionResult, InfrastructureChange } from '../../types/infrastructure';
export declare class GCPProvider implements ResourceProvider {
    private projectId;
    private region;
    private zone;
    constructor(projectId: string, region?: string, zone?: string);
    provision(resource: ResourceDefinition, infrastructureId: string): Promise<ResourceProvisionResult>;
    update(resource: ResourceDefinition, _change: InfrastructureChange, _infrastructureId: string): Promise<ResourceProvisionResult>;
    destroy(resource: ResourceDefinition, _infrastructureId: string): Promise<ResourceProvisionResult>;
    import(importConfig: ResourceImportConfig): Promise<ResourceProvisionResult>;
    getStatus(resourceId: string): Promise<ResourceStatus>;
    refresh(resource: ResourceDefinition): Promise<ResourceDefinition>;
    private provisionComputeEngine;
    private provisionCloudStorage;
    private provisionVPCNetwork;
    private provisionCloudSQL;
    private provisionLoadBalancer;
    private provisionGKECluster;
    private provisionCloudFunction;
}
//# sourceMappingURL=GCPProvider.d.ts.map