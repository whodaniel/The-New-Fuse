import { ResourceManager } from '@the-new-fuse/types';
export declare class PerformanceAnalyzer implements ResourceManager {
    private readonly THROUGHPUT_THRESHOLD;
    private readonly LATENCY_THRESHOLD;
    private readonly CPU_THRESHOLD;
    private readonly MEMORY_THRESHOLD;
    private readonly logger;
    PrismaService: any;
    private readonly metricsService;
    private readonly taskService;
}
