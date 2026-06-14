import { ConfigService } from '@nestjs/config';
interface HealthCheck {
    component: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details?: Record<string, any>;
}
interface Diagnostics {
    overall: 'healthy' | 'warning' | 'critical';
    checks: HealthCheck[];
}
interface Resolution {
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
}
export declare class SystemDiagnosticsService {
    private configService;
    private readonly logger;
    private healthChecks;
    constructor(configService: ConfigService);
    runDiagnostics(): Promise<Diagnostics>;
    getResolution(diagnostics: Diagnostics): Resolution;
    registerHealthCheck(check: HealthCheck): void;
    private executeChecks;
    private getOverallStatus;
    private generateResolution;
    private registerInitialChecks;
    private checkDatabase;
    private checkRedis;
}
export {};
//# sourceMappingURL=system-diagnostics.service.d.ts.map