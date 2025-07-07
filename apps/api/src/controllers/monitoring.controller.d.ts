import { MonitoringService } from '../services/monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    getMetrics(): Promise<any>;
    getHealth(): Promise<any>;
}
