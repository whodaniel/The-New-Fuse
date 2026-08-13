/**
 * NestJS Health Check Controller Template
 * Provides health check endpoints for NestJS applications
 */
export interface HealthEndpointResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services?: Record<string, any>;
    metrics?: Record<string, any>;
}
/**
 * Health controller template
 * This provides the structure for implementing health checks in NestJS
 */
export declare class HealthControllerTemplate {
    /**
     * Basic liveness probe
     * Returns 200 if the application is running
     */
    static liveness(): Promise<{
        status: string;
    }>;
    /**
     * Readiness probe
     * Returns 200 if the application is ready to serve traffic
     */
    static readiness(healthCheckService?: any): Promise<HealthEndpointResponse>;
    /**
     * Detailed health check
     * Returns detailed health information
     */
    static health(healthCheckService?: any): Promise<HealthEndpointResponse>;
    /**
     * Startup probe
     * Returns 200 when the application has completed initialization
     */
    static startup(startupComplete?: boolean): Promise<{
        status: string;
    }>;
}
/**
 * Example NestJS controller implementation
 */
export declare const healthControllerExample = "\nimport { Controller, Get } from '@nestjs/common';\nimport { HealthCheckService } from '@the-new-fuse/core-monitoring';\nimport { HealthControllerTemplate } from '@the-new-fuse/core-monitoring/nestjs';\n\n@Controller('health')\nexport class HealthController {\n  constructor(private readonly healthCheckService: HealthCheckService) {}\n\n  @Get('live')\n  async liveness() {\n    return HealthControllerTemplate.liveness();\n  }\n\n  @Get('ready')\n  async readiness() {\n    return HealthControllerTemplate.readiness(this.healthCheckService);\n  }\n\n  @Get()\n  async health() {\n    return HealthControllerTemplate.health(this.healthCheckService);\n  }\n\n  @Get('startup')\n  async startup() {\n    return HealthControllerTemplate.startup(true);\n  }\n}\n";
//# sourceMappingURL=health.controller.d.ts.map