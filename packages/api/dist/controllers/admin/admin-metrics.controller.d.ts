/**
 * Admin Metrics Controller
 */
import { Response } from 'express';
import { ApiLogsRepository } from '../../repositories/api-logs.repository';
import { SystemMetricsService } from '../../services/system-metrics.service';
export declare class AdminMetricsController {
    private readonly systemMetricsService;
    private readonly apiLogsRepository;
    constructor(systemMetricsService: SystemMetricsService, apiLogsRepository: ApiLogsRepository);
    getSystemMetrics(res: Response): Promise<Response<any, Record<string, any>>>;
    getApiAnalytics(range: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=admin-metrics.controller.d.ts.map