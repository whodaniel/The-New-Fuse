/**
 * Health Check Controller
 * Provides health check endpoints for the application
 */
import { HealthService } from '../services/health.service';
interface HealthIndicatorResult {
    [key: string]: {
        status: string;
        message?: string;
    };
}
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    /**
     * Basic health check endpoint using Terminus
     * @returns Health check status
     */
    check(): Promise<HealthIndicatorResult>;
}
export {};
//# sourceMappingURL=health.controller.d.ts.map