/**
 * System Metrics Service
 *
 * Provides real-time system and application metrics.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
import { ApiLogsRepository } from '../repositories/api-logs.repository';
export declare class SystemMetricsService {
    private readonly db;
    private readonly apiLogsRepository;
    constructor(db: DrizzleClient, apiLogsRepository: ApiLogsRepository);
    getMetrics(): Promise<{
        cpu: {
            usagePercent: number;
        };
        memory: {
            usagePercent: number;
        };
        disk: {
            usagePercent: number;
        };
        network: {
            totalTraffic: number;
        };
        database: {
            activeConnections: unknown;
        };
        api: {
            requestsPerMinute: number;
            avgResponseTime: number;
            errorRate: number;
        };
        systemInfo: {
            platform: NodeJS.Platform;
            release: string;
            arch: NodeJS.Architecture;
            hostname: string;
            uptime: number;
            totalMemory: number;
            cpus: number;
        };
    }>;
    private getCpuUsage;
    private getMemoryUsage;
    private getDatabaseMetrics;
    private getApiMetrics;
}
//# sourceMappingURL=system-metrics.service.d.ts.map