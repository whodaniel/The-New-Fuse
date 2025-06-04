import { HealthService, HealthStatus } from '../services/healthService.js';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getBasicHealth(): Promise<{
        status: any;
        timestamp: any;
    }>;
    getDetailedHealth(): Promise<HealthStatus>;
}
