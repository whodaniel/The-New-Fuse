import { HealthCheckService, HttpHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
export declare class HealthService {
    private health;
    private http;
    private readonly logger;
    constructor(health: HealthCheckService, http: HttpHealthIndicator);
    check(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=HealthService.d.ts.map