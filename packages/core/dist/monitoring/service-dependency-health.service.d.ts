export declare class ServiceDependencyHealthService {
    private readonly logger;
    constructor();
    checkHealth(serviceName: string): Promise<{
        status: 'up' | 'down';
    }>;
}
//# sourceMappingURL=service-dependency-health.service.d.ts.map