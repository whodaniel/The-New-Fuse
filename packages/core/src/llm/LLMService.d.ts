import { MonitoringService } from '../monitoring/MonitoringService.js';
export declare class LLMService {
    private configService;
    private monitoringService;
    private providers;
    string: any;
    private logger;
    constructor(configService: unknown, monitoringService: MonitoringService);
}
