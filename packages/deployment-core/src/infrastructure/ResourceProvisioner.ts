/**
 * Resource Provisioner
 * Handles provisioning, updating, and destroying infrastructure resources
 */

import {
  ResourceDefinition,
  ResourceProvisionResult,
  InfrastructureChange,
  InfrastructureState,
  ResourceType,
  CloudProvider,
  ChangeAction,
  ResourceState
} from '../types/infrastructure.js';
import { InfrastructureImportConfig } from '../interfaces/IInfrastructureManager.js';
import { GCPProvider } from './providers/GCPProvider.js';

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

export enum ResourceHealth {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export class ResourceProvisioner {
  private providers: Map<CloudProvider, Map<ResourceType, ResourceProvider>>;
  private provisioningQueue: ProvisioningQueue;

  constructor() {
    this.providers = new Map();
    this.provisioningQueue = new ProvisioningQueue();
    this.initializeProviders();
  }

  async provisionResources(
    resources: ResourceDefinition[], 
    infrastructureId: string
  ): Promise<ResourceProvisionResult[]> {
    try {
      // Sort resources by dependencies
      const sortedResources = this.sortResourcesByDependencies(resources);
      
      // Group resources by dependency level for parallel provisioning
      const resourceGroups = this.groupResourcesByDependencyLevel(sortedResources);
      
      const results: ResourceProvisionResult[] = [];

      // Provision resources group by group
      for (const group of resourceGroups) {
        const groupResults = await Promise.all(
          group.map(resource => this.provisionResource(resource, infrastructureId))
        );
        results.push(...groupResults);

        // Check if any resource in the group failed
        const failedResources = groupResults.filter(r => !r.success);
        if (failedResources.length > 0) {
          // Stop provisioning if critical resources failed
          const criticalFailures = failedResources.filter(r => 
            this.isCriticalResource(r.resourceType)
          );
          
          if (criticalFailures.length > 0) {
            throw new Error(`Critical resource provisioning failed: ${criticalFailures.map(r => r.resourceName).join(', ')}`);
          }
        }
      }

      return results;

    } catch (error) {
      throw new Error(`Resource provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async destroyResources(
    resources: any[], 
    infrastructureId: string
  ): Promise<ResourceProvisionResult[]> {
    try {
      // Destroy resources in reverse dependency order
      const sortedResources = this.sortResourcesByDependencies(
        resources.map(r => this.convertStateToDefinition(r))
      ).reverse();

      const results: ResourceProvisionResult[] = [];

      // Destroy resources one by one to handle dependencies properly
      for (const resource of sortedResources) {
        try {
          const result = await this.destroyResource(resource, infrastructureId);
          results.push(result);
        } catch (error) {
          // Continue destroying other resources even if one fails
          results.push({
            resourceName: resource.name,
            resourceType: resource.type,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;

    } catch (error) {
      throw new Error(`Resource destruction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async applyChange(change: InfrastructureChange, infrastructureId: string): Promise<ResourceProvisionResult> {
    try {
      const resource: ResourceDefinition = {
        type: change.resourceType,
        name: change.resourceName,
        properties: change.after || {},
        dependencies: [],
        lifecycle: {
          createBeforeDestroy: false,
          preventDestroy: false,
          ignoreChanges: [],
          replaceTriggeredBy: []
        },
        tags: {}
      };

      switch (change.action) {
        case ChangeAction.CREATE:
          return await this.provisionResource(resource, infrastructureId);
        
        case ChangeAction.UPDATE:
          return await this.updateResource(resource, change, infrastructureId);
        
        case ChangeAction.DELETE:
          return await this.destroyResource(resource, infrastructureId);
        
        case ChangeAction.REPLACE:
          // Destroy old resource and create new one
          const destroyResult = await this.destroyResource(resource, infrastructureId);
          if (!destroyResult.success) {
            return destroyResult;
          }
          return await this.provisionResource(resource, infrastructureId);
        
        case ChangeAction.NO_CHANGE:
          return {
            resourceName: resource.name,
            resourceType: resource.type,
            success: true
          };
        
        default:
          throw new Error(`Unknown change action: ${change.action}`);
      }

    } catch (error) {
      return {
        resourceName: change.resourceName,
        resourceType: change.resourceType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async importResources(importConfig: InfrastructureImportConfig): Promise<ResourceProvisionResult[]> {
    try {
      const results: ResourceProvisionResult[] = [];

      for (const resourceId of importConfig.resourceIds) {
        try {
          const importResult = await this.importResource({
            resourceId,
            resourceType: ResourceType.COMPUTE, // This should be detected
            provider: importConfig.provider,
            region: importConfig.region,
            tags: importConfig.tags
          });
          
          results.push(importResult);
        } catch (error) {
          results.push({
            resourceName: resourceId,
            resourceType: ResourceType.COMPUTE,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;

    } catch (error) {
      throw new Error(`Resource import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshResourceStates(state: InfrastructureState): Promise<InfrastructureState> {
    try {
      const refreshedResources = [];

      for (const resource of state.resources) {
        try {
          const resourceDef = this.convertStateToDefinition(resource);
          const provider = this.getProvider(CloudProvider.GCP, resourceDef.type);
          
          if (provider) {
            const refreshedDef = await provider.refresh(resourceDef);
            const status = await provider.getStatus(resource.id);
            
            refreshedResources.push({
              ...resource,
              properties: refreshedDef.properties,
              outputs: status.outputs,
              lastModified: status.lastUpdated
            });
          } else {
            refreshedResources.push(resource);
          }
        } catch (error) {
          // Keep original resource if refresh fails
          refreshedResources.push({
            ...resource,
            error: error instanceof Error ? error.message : 'Refresh failed'
          });
        }
      }

      return {
        ...state,
        resources: refreshedResources,
        updatedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Failed to refresh resource states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async provisionResource(
    resource: ResourceDefinition, 
    infrastructureId: string
  ): Promise<ResourceProvisionResult> {
    try {
      const provider = this.getProvider(resource.provider || CloudProvider.GCP, resource.type);
      if (!provider) {
        throw new Error(`No provider found for ${resource.provider || 'default'} ${resource.type}`);
      }

      // Add to provisioning queue
      await this.provisioningQueue.add({
        resource,
        infrastructureId,
        action: 'provision'
      });

      const result = await provider.provision(resource, infrastructureId);

      // Remove from queue
      await this.provisioningQueue.complete({
        resource,
        infrastructureId,
        action: 'provision'
      });

      return result;

    } catch (error) {
      return {
        resourceName: resource.name,
        resourceType: resource.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateResource(
    resource: ResourceDefinition, 
    change: InfrastructureChange,
    infrastructureId: string
  ): Promise<ResourceProvisionResult> {
    try {
      const provider = this.getProvider(resource.provider || CloudProvider.GCP, resource.type);
      if (!provider) {
        throw new Error(`No provider found for ${resource.provider || 'default'} ${resource.type}`);
      }

      return await provider.update(resource, change, infrastructureId);

    } catch (error) {
      return {
        resourceName: resource.name,
        resourceType: resource.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async destroyResource(
    resource: ResourceDefinition, 
    infrastructureId: string
  ): Promise<ResourceProvisionResult> {
    try {
      const provider = this.getProvider(resource.provider || CloudProvider.GCP, resource.type);
      if (!provider) {
        throw new Error(`No provider found for ${resource.provider || 'default'} ${resource.type}`);
      }

      return await provider.destroy(resource, infrastructureId);

    } catch (error) {
      return {
        resourceName: resource.name,
        resourceType: resource.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async importResource(importConfig: ResourceImportConfig): Promise<ResourceProvisionResult> {
    try {
      const provider = this.getProvider(importConfig.provider, importConfig.resourceType);
      if (!provider) {
        throw new Error(`No provider found for ${importConfig.provider} ${importConfig.resourceType}`);
      }

      return await provider.import(importConfig);

    } catch (error) {
      return {
        resourceName: importConfig.resourceId,
        resourceType: importConfig.resourceType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getProvider(cloudProvider: CloudProvider, resourceType: ResourceType): ResourceProvider | null {
    const providerMap = this.providers.get(cloudProvider);
    return providerMap?.get(resourceType) || null;
  }

  private sortResourcesByDependencies(resources: ResourceDefinition[]): ResourceDefinition[] {
    const sorted: ResourceDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (resource: ResourceDefinition) => {
      if (visiting.has(resource.name)) {
        throw new Error(`Circular dependency detected: ${resource.name}`);
      }
      
      if (visited.has(resource.name)) {
        return;
      }

      visiting.add(resource.name);

      // Visit dependencies first
      for (const depName of resource.dependencies) {
        const dependency = resources.find(r => r.name === depName);
        if (dependency) {
          visit(dependency);
        }
      }

      visiting.delete(resource.name);
      visited.add(resource.name);
      sorted.push(resource);
    };

    for (const resource of resources) {
      if (!visited.has(resource.name)) {
        visit(resource);
      }
    }

    return sorted;
  }

  private groupResourcesByDependencyLevel(resources: ResourceDefinition[]): ResourceDefinition[][] {
    const groups: ResourceDefinition[][] = [];
    const processed = new Set<string>();

    while (processed.size < resources.length) {
      const currentGroup: ResourceDefinition[] = [];

      for (const resource of resources) {
        if (processed.has(resource.name)) {
          continue;
        }

        // Check if all dependencies are already processed
        const allDepsProcessed = resource.dependencies.every(dep => processed.has(dep));
        
        if (allDepsProcessed) {
          currentGroup.push(resource);
          processed.add(resource.name);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error('Unable to resolve resource dependencies');
      }

      groups.push(currentGroup);
    }

    return groups;
  }

  private isCriticalResource(resourceType: ResourceType): boolean {
    const criticalTypes = [
      ResourceType.VPC_NETWORK,
      ResourceType.FIREWALL_RULE,
      ResourceType.IAM_ROLE
    ];
    return criticalTypes.includes(resourceType);
  }

  private convertStateToDefinition(resource: any): ResourceDefinition {
    return {
      type: resource.type,
      name: resource.name,
      properties: resource.properties || {},
      dependencies: [],
      lifecycle: {
        createBeforeDestroy: false,
        preventDestroy: false,
        ignoreChanges: [],
        replaceTriggeredBy: []
      },
      tags: resource.tags || {}
    };
  }

  private initializeProviders(): void {
    // Initialize GCP providers
    const gcpProvider = new GCPProvider('my-gcp-project', 'us-central1', 'us-central1-a');
    const gcpProviders = new Map<ResourceType, ResourceProvider>();
    gcpProviders.set(ResourceType.COMPUTE_ENGINE, gcpProvider);
    gcpProviders.set(ResourceType.CLOUD_STORAGE, gcpProvider);
    gcpProviders.set(ResourceType.VPC_NETWORK, gcpProvider);
    gcpProviders.set(ResourceType.CLOUD_SQL, gcpProvider);
    gcpProviders.set(ResourceType.LOAD_BALANCER, gcpProvider);
    gcpProviders.set(ResourceType.GKE_CLUSTER, gcpProvider);
    gcpProviders.set(ResourceType.CLOUD_FUNCTION, gcpProvider);
    this.providers.set(CloudProvider.GCP, gcpProviders);
  }
}

// Provisioning Queue for managing concurrent operations
class ProvisioningQueue {
  private queue: ProvisioningTask[] = [];
  private active: Map<string, ProvisioningTask> = new Map();

  async add(task: ProvisioningTask): Promise<void> {
    this.queue.push(task);
  }

  async complete(task: ProvisioningTask): Promise<void> {
    const key = `${task.infrastructureId}-${task.resource.name}`;
    this.active.delete(key);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveCount(): number {
    return this.active.size;
  }
}

interface ProvisioningTask {
  resource: ResourceDefinition;
  infrastructureId: string;
  action: 'provision' | 'update' | 'destroy';
}

