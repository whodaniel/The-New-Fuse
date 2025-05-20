import { HealthService, HealthStatus } from '../services/healthService.js';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getBasicHealth(): Promise<{
        status: "healthy" | "unhealthy" | "degraded";
        timestamp: Date;
    }>;
    getDetailedHealth(): Promise<HealthStatus>;
}
