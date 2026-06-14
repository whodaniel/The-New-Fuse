import { WorkflowTemplate } from '../types/types.js';
interface ResourceAllocation {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
}
interface ResourceMetrics {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
}
interface ResourcePool {
    scale(requirements: any): Promise<void>;
}
interface LoadBalancer {
    getCurrentLoad(): Promise<number>;
}
export declare class WorkflowResourceManager {
    private readonly resourcePool;
    private readonly loadBalancer;
    constructor(resourcePool: ResourcePool, loadBalancer: LoadBalancer);
    allocateResources(workflow: WorkflowTemplate): Promise<ResourceAllocation>;
    getResourceMetrics(): Promise<ResourceMetrics>;
    private calculateResourceRequirements;
    private shouldScale;
    private scaleResources;
    private getCPUMetrics;
    private getMemoryMetrics;
    private getNetworkMetrics;
    private getStorageMetrics;
}
export {};
//# sourceMappingURL=resources.d.ts.map