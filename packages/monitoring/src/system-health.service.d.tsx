import { PrometheusService } from './(prometheus as any).service.js';
export declare class SystemHealthService {
    private readonly prometheus;
    constructor(prometheus: PrometheusService);
    checkSystemHealth(): Promise<void>;
}
