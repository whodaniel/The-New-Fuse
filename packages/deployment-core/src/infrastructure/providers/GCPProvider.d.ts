/**
 * Google Cloud Platform Provider
 * Handles GCP-specific infrastructure provisioning
 */
import { ResourceProvider } from '../ResourceProvisioner';
import { ResourceDefinition, ResourceProvisionResult } from '../../types/infrastructure';
export declare class GCPProvider implements ResourceProvider {
    private projectId;
    private region;
    private zone;
    constructor(projectId: string, region?: string, zone?: string);
    provision(resource: ResourceDefinition, infrastructureId: string): Promise<ResourceProvisionResult>;
    private provisionComputeEngine;
    private provisionCloudStorage;
}
//# sourceMappingURL=GCPProvider.d.ts.map