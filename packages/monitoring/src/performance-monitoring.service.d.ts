import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service';
export interface PerformanceMetric {
    name: string;
    value: number;
    tags?: Record<string, string>;
    timestamp?: Date;
    unit?: string;
    context?: Record<string, any>;
}
export interface PerformanceThreshold {
    metricName: string;
    operator: gt;
}
export declare class PerformanceMonitoringService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly sampleRate;
    private readonly thresholds;
    private readonly alertingEnabled;
    constructor(configService: ConfigService, prisma: PrismaService);
}
//# sourceMappingURL=performance-monitoring.service.d.ts.map