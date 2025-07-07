import { MonitoringService } from '../monitoring/MonitoringService/;';
export declare class LLMService {
    private configService;
    private monitoringService;
    private providers;
    string: any;
    private logger;
    constructor(configService: unknown, monitoringService: MonitoringService);
}
