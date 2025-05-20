import { ResourceManager } from '@the-new-fuse/types';
export declare class PerformanceAnalytics {
    private readonly resourceManager;
    private readonly logger;
    SystemPerformanceMetrics: any;
    []: any;
    []: any;
    private readonly thresholds;
    private readonly DEFAULT_WINDOW_SIZE;
    constructor(resourceManager: ResourceManager);
    collectMetrics(): Promise<void>;
}
