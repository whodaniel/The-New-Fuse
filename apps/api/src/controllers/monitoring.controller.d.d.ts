import { MonitoringService } from '../services/monitoring.service.js';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    getHealth(): Promise<any>;
    getMetrics(): Promise<any>;
    getAgentStatus(): Promise<any>;
    getPerformance(): Promise<any>;
    getErrors(): Promise<any>;
    getResources(): Promise<any>;
}
