import { MonitoringService } from '../services/monitoring.service.js';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    getMetrics(): Promise<any>;
    getHealth(): Promise<any>;
}
