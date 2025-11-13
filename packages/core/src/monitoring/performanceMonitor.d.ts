import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggingService } from '../services/LoggingService';
import { MetricsService } from './MetricsService';
import { ConfigService } from '../config/ConfigService';
export declare class PerformanceMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly metricsService;
    private readonly configService;
    private readonly collectionInterval;
    private intervalId?;
    private performanceObserver?;
    constructor(logger: LoggingService, metricsService: MetricsService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startMonitoring;
    private stopMonitoring;
    private setupPerformanceObserver;
    private collectSystemMetrics;
    measureExecutionTime<T>(fn: () => T, name: string): T;
}
export declare function MeasurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
//# sourceMappingURL=performanceMonitor.d.ts.map