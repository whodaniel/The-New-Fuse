/**
 * Proxy Controller
 * Health checks and service discovery for the API Gateway
 */
import { ProxyService } from './proxy.service';
export declare class ProxyController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    getServicesHealth(): Promise<{
        gateway: string;
        services: Record<string, boolean>;
        overall: string;
        timestamp: string;
    }>;
    getServices(): Promise<{
        count: number;
        services: {
            name: string;
            baseUrl: string;
            healthPath: string;
        }[];
    }>;
}
//# sourceMappingURL=proxy.controller.d.ts.map