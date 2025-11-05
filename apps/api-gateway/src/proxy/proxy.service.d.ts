/**
 * Proxy Service
 * Handles routing and load balancing to backend services
 */
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
export interface ServiceConfig {
    name: string;
    baseUrl: string;
    healthPath: string;
    timeout?: number;
    retries?: number;
}
export declare class ProxyService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly services;
    private readonly routeMappings;
    constructor(httpService: HttpService, configService: ConfigService);
    private initializeServices;
    /**
     * Initialize intelligent route mappings for consolidated services
     */
    private initializeRouteMappings;
    /**
     * Determine which service should handle a given path
     */
    private determineServiceForPath;
    registerService(config: ServiceConfig): void;
    proxyRequest(path: string, method: string, headers: Record<string, string>, body?: any, query?: Record<string, string>, serviceName?: string): Promise<AxiosResponse>;
    checkServiceHealth(serviceName: string): Promise<boolean>;
    getAllServicesHealth(): Promise<Record<string, boolean>>;
    getServiceConfig(serviceName: string): ServiceConfig | undefined;
    getAllServices(): ServiceConfig[];
}
//# sourceMappingURL=proxy.service.d.ts.map