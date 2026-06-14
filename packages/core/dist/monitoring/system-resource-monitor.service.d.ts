export declare class SystemResourceMonitorService {
    private readonly logger;
    constructor();
    getMemoryUsage(): {
        free: number;
        total: number;
        used: number;
    };
    getCpuUsage(): number;
    getDiskUsage(): Promise<{
        free: number;
        total: number;
        used: number;
    }>;
}
//# sourceMappingURL=system-resource-monitor.service.d.ts.map