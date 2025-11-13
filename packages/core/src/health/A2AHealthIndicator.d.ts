import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { A2AService } from '../services/A2AService';
import { A2AConfig } from '../config/A2AConfig';
export declare class A2AHealthIndicator extends HealthIndicator {
    private readonly a2aService;
    private readonly config;
    private logger;
    constructor(a2aService: A2AService, config: A2AConfig);
    isHealthy(key?: string): Promise<HealthIndicatorResult>;
    private checkAgentConnectivity;
    private checkMessageQueue;
    private checkSecurityService;
    private checkPersistenceService;
    const healthData: {
        status: string;
        agentId: any;
        agentName: any;
        agentStatus: any;
        lastSeen: any;
        capabilities: any;
        version: any;
        uptime: any;
        memoryUsage: any;
        cpuUsage: any;
        messageQueue: any;
        activeConnections: any;
        errorRate: any;
        responseTime: any;
    };
    const isHealthy: (key?: string) => Promise<HealthIndicatorResult>;
}
//# sourceMappingURL=A2AHealthIndicator.d.ts.map