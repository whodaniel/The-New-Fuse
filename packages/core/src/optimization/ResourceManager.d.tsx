import { Logger } from '../logging/LoggingService.js';
export interface ResourceLimits {
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxConcurrentTasks: number;
}
export interface ResourceMetrics {
    memoryUsage: {
        total: number;
        free: number;
        used: number;
        percentUsed: number;
    };
    cpuUsage: {
        system: number;
        process: number;
        idle: number;
    };
    activeTasks: number;
}
export declare class ResourceManager {
    private limits;
    private activeTasks;
    Logger: any;
    constructor(limits: Partial<ResourceLimits>, logger: Logger);
}
