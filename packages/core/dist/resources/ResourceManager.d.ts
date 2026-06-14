import { OnModuleDestroy } from '@nestjs/common';
export interface ResourceUsage {
    cpu: NodeJS.CpuUsage;
    memory: NodeJS.MemoryUsage;
    uptime: number;
}
export declare class ResourceManager implements OnModuleDestroy {
    private readonly logger;
    private readonly monitoringInterval;
    private allocatedResources;
    constructor();
    onModuleDestroy(): void;
    getCurrentUsage(): ResourceUsage;
    allocateResource<T>(consumerId: string, resource: T): boolean;
    getResource<T>(consumerId: string): T | undefined;
    releaseResource(consumerId: string): boolean;
    private logResourceUsage;
}
//# sourceMappingURL=ResourceManager.d.ts.map