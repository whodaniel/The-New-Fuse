import { apiLogs } from '../schema/api-logs.js';
export declare class DrizzleApiLogsRepository {
    logRequest(data: typeof apiLogs.$inferInsert): Promise<{
        path: string;
        duration: number;
        id: string;
        createdAt: Date;
        userId: string | null;
        userAgent: string | null;
        method: string;
        statusCode: number;
        ip: string | null;
    }[]>;
    getRecentLogs(limit?: number): Promise<{
        id: string;
        method: string;
        path: string;
        statusCode: number;
        duration: number;
        ip: string | null;
        userAgent: string | null;
        userId: string | null;
        createdAt: Date;
    }[]>;
    getStats(startDate?: Date, endDate?: Date): Promise<{
        count: number;
        avgDuration: number;
        errorCount: number;
    }[]>;
    getStatusCodeDistribution(startDate?: Date, endDate?: Date): Promise<{
        status: number;
        count: number;
    }[]>;
    getMethodDistribution(startDate?: Date, endDate?: Date): Promise<{
        method: string;
        count: number;
    }[]>;
    getTopEndpoints(limit?: number, startDate?: Date, endDate?: Date): Promise<{
        endpoint: string;
        count: number;
        avgDuration: number;
        errorCount: number;
    }[]>;
    getTimeSeriesData(startDate: Date, endDate: Date): Promise<{
        time: string;
        requests: number;
        errors: number;
        avgDuration: number;
    }[]>;
}
export declare const drizzleApiLogsRepository: DrizzleApiLogsRepository;
//# sourceMappingURL=api-logs.repository.d.ts.map