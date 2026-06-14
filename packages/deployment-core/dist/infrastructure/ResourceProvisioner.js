"use strict";
/**
 * Resource Provisioner
 * Handles provisioning, updating, and destroying infrastructure resources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceProvisioner = exports.ResourceHealth = void 0;
const infrastructure_js_1 = require("../types/infrastructure.js");
const GCPProvider_js_1 = require("./providers/GCPProvider.js");
var ResourceHealth;
(function (ResourceHealth) {
    ResourceHealth["HEALTHY"] = "healthy";
    ResourceHealth["DEGRADED"] = "degraded";
    ResourceHealth["UNHEALTHY"] = "unhealthy";
    ResourceHealth["UNKNOWN"] = "unknown";
})(ResourceHealth || (exports.ResourceHealth = ResourceHealth = {}));
class ResourceProvisioner {
    constructor() {
        this.providers = new Map();
        this.provisioningQueue = new ProvisioningQueue();
        this.initializeProviders();
    }
    async provisionResources(resources, infrastructureId) {
        try {
            // Sort resources by dependencies
            const sortedResources = this.sortResourcesByDependencies(resources);
            // Group resources by dependency level for parallel provisioning
            const resourceGroups = this.groupResourcesByDependencyLevel(sortedResources);
            const results = [];
            // Provision resources group by group
            for (const group of resourceGroups) {
                const groupResults = await Promise.all(group.map(resource => this.provisionResource(resource, infrastructureId)));
                results.push(...groupResults);
                // Check if any resource in the group failed
                const failedResources = groupResults.filter(r => !r.success);
                if (failedResources.length > 0) {
                    // Stop provisioning if critical resources failed
                    const criticalFailures = failedResources.filter(r => this.isCriticalResource(r.resourceType));
                    if (criticalFailures.length > 0) {
                        throw new Error(`Critical resource provisioning failed: ${criticalFailures.map(r => r.resourceName).join(', ')}`);
                    }
                }
            }
            return results;
        }
        catch (error) {
            throw new Error(`Resource provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async destroyResources(resources, infrastructureId) {
        try {
            // Destroy resources in reverse dependency order
            const sortedResources = this.sortResourcesByDependencies(resources.map(r => this.convertStateToDefinition(r))).reverse();
            const results = [];
            // Destroy resources one by one to handle dependencies properly
            for (const resource of sortedResources) {
                try {
                    const result = await this.destroyResource(resource, infrastructureId);
                    results.push(result);
                }
                catch (error) {
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
        }
        catch (error) {
            throw new Error(`Resource destruction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async applyChange(change, infrastructureId) {
        try {
            const resource = {
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
                case infrastructure_js_1.ChangeAction.CREATE:
                    return await this.provisionResource(resource, infrastructureId);
                case infrastructure_js_1.ChangeAction.UPDATE:
                    return await this.updateResource(resource, change, infrastructureId);
                case infrastructure_js_1.ChangeAction.DELETE:
                    return await this.destroyResource(resource, infrastructureId);
                case infrastructure_js_1.ChangeAction.REPLACE:
                    // Destroy old resource and create new one
                    const destroyResult = await this.destroyResource(resource, infrastructureId);
                    if (!destroyResult.success) {
                        return destroyResult;
                    }
                    return await this.provisionResource(resource, infrastructureId);
                case infrastructure_js_1.ChangeAction.NO_CHANGE:
                    return {
                        resourceName: resource.name,
                        resourceType: resource.type,
                        success: true
                    };
                default:
                    throw new Error(`Unknown change action: ${change.action}`);
            }
        }
        catch (error) {
            return {
                resourceName: change.resourceName,
                resourceType: change.resourceType,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async importResources(importConfig) {
        try {
            const results = [];
            for (const resourceId of importConfig.resourceIds) {
                try {
                    const importResult = await this.importResource({
                        resourceId,
                        resourceType: infrastructure_js_1.ResourceType.COMPUTE, // This should be detected
                        provider: importConfig.provider,
                        region: importConfig.region,
                        tags: importConfig.tags
                    });
                    results.push(importResult);
                }
                catch (error) {
                    results.push({
                        resourceName: resourceId,
                        resourceType: infrastructure_js_1.ResourceType.COMPUTE,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            return results;
        }
        catch (error) {
            throw new Error(`Resource import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async refreshResourceStates(state) {
        try {
            const refreshedResources = [];
            for (const resource of state.resources) {
                try {
                    const resourceDef = this.convertStateToDefinition(resource);
                    const provider = this.getProvider(infrastructure_js_1.CloudProvider.GCP, resourceDef.type);
                    if (provider) {
                        const refreshedDef = await provider.refresh(resourceDef);
                        const status = await provider.getStatus(resource.id);
                        refreshedResources.push({
                            ...resource,
                            properties: refreshedDef.properties,
                            outputs: status.outputs,
                            lastModified: status.lastUpdated
                        });
                    }
                    else {
                        refreshedResources.push(resource);
                    }
                }
                catch (error) {
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
        }
        catch (error) {
            throw new Error(`Failed to refresh resource states: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async provisionResource(resource, infrastructureId) {
        try {
            const provider = this.getProvider(resource.provider || infrastructure_js_1.CloudProvider.GCP, resource.type);
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
        }
        catch (error) {
            return {
                resourceName: resource.name,
                resourceType: resource.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async updateResource(resource, change, infrastructureId) {
        try {
            const provider = this.getProvider(resource.provider || infrastructure_js_1.CloudProvider.GCP, resource.type);
            if (!provider) {
                throw new Error(`No provider found for ${resource.provider || 'default'} ${resource.type}`);
            }
            return await provider.update(resource, change, infrastructureId);
        }
        catch (error) {
            return {
                resourceName: resource.name,
                resourceType: resource.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async destroyResource(resource, infrastructureId) {
        try {
            const provider = this.getProvider(resource.provider || infrastructure_js_1.CloudProvider.GCP, resource.type);
            if (!provider) {
                throw new Error(`No provider found for ${resource.provider || 'default'} ${resource.type}`);
            }
            return await provider.destroy(resource, infrastructureId);
        }
        catch (error) {
            return {
                resourceName: resource.name,
                resourceType: resource.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async importResource(importConfig) {
        try {
            const provider = this.getProvider(importConfig.provider, importConfig.resourceType);
            if (!provider) {
                throw new Error(`No provider found for ${importConfig.provider} ${importConfig.resourceType}`);
            }
            return await provider.import(importConfig);
        }
        catch (error) {
            return {
                resourceName: importConfig.resourceId,
                resourceType: importConfig.resourceType,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    getProvider(cloudProvider, resourceType) {
        const providerMap = this.providers.get(cloudProvider);
        return providerMap?.get(resourceType) || null;
    }
    sortResourcesByDependencies(resources) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (resource) => {
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
    groupResourcesByDependencyLevel(resources) {
        const groups = [];
        const processed = new Set();
        while (processed.size < resources.length) {
            const currentGroup = [];
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
    isCriticalResource(resourceType) {
        const criticalTypes = [
            infrastructure_js_1.ResourceType.VPC_NETWORK,
            infrastructure_js_1.ResourceType.FIREWALL_RULE,
            infrastructure_js_1.ResourceType.IAM_ROLE
        ];
        return criticalTypes.includes(resourceType);
    }
    convertStateToDefinition(resource) {
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
    initializeProviders() {
        // Initialize GCP providers
        const gcpProvider = new GCPProvider_js_1.GCPProvider('my-gcp-project', 'us-central1', 'us-central1-a');
        const gcpProviders = new Map();
        gcpProviders.set(infrastructure_js_1.ResourceType.COMPUTE_ENGINE, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.CLOUD_STORAGE, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.VPC_NETWORK, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.CLOUD_SQL, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.LOAD_BALANCER, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.GKE_CLUSTER, gcpProvider);
        gcpProviders.set(infrastructure_js_1.ResourceType.CLOUD_FUNCTION, gcpProvider);
        this.providers.set(infrastructure_js_1.CloudProvider.GCP, gcpProviders);
    }
}
exports.ResourceProvisioner = ResourceProvisioner;
// Provisioning Queue for managing concurrent operations
class ProvisioningQueue {
    constructor() {
        this.queue = [];
        this.active = new Map();
    }
    async add(task) {
        this.queue.push(task);
    }
    async complete(task) {
        const key = `${task.infrastructureId}-${task.resource.name}`;
        this.active.delete(key);
    }
    getQueueLength() {
        return this.queue.length;
    }
    getActiveCount() {
        return this.active.size;
    }
}
//# sourceMappingURL=ResourceProvisioner.js.map