/**
 * NestJS Monitoring Module
 * Provides monitoring integration for NestJS applications
 */
export interface MonitoringModuleOptions {
    sentry?: {
        enabled: boolean;
        dsn: string;
        environment: string;
        serviceName: string;
        release?: string;
        tracesSampleRate?: number;
    };
    logging?: {
        enabled: boolean;
        level: string;
        serviceName: string;
        file?: {
            enabled: boolean;
            dir: string;
        };
    };
    metrics?: {
        enabled: boolean;
        prefix?: string;
        defaultLabels?: Record<string, string>;
    };
    healthCheck?: {
        enabled: boolean;
        checkInterval?: number;
    };
    alerts?: {
        enabled: boolean;
        evaluationInterval?: number;
    };
}
/**
 * Monitoring module factory
 * Note: This is a type-safe template. Actual NestJS module would be implemented
 * in the service-specific packages that use @nestjs/common
 */
export declare class MonitoringModuleFactory {
    static forRoot(options: MonitoringModuleOptions): {
        module: string;
        providers: ({
            provide: string;
            useValue: MonitoringModuleOptions;
            useFactory?: undefined;
        } | {
            provide: string;
            useFactory: () => Promise<import("..").SentryService | null>;
            useValue?: undefined;
        } | {
            provide: string;
            useFactory: () => Promise<import("..").WinstonLogger | null>;
            useValue?: undefined;
        } | {
            provide: string;
            useFactory: () => Promise<import("..").PrometheusMetrics | null>;
            useValue?: undefined;
        } | {
            provide: string;
            useFactory: () => Promise<import("..").HealthCheckService | null>;
            useValue?: undefined;
        })[];
        exports: string[];
    };
}
//# sourceMappingURL=monitoring.module.d.ts.map