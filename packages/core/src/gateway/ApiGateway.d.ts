import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
export interface ApiGatewayConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    cors: {
        enabled: boolean;
        origins: string[];
        methods: string[];
        headers: string[];
    };
    authentication: {
        enabled: boolean;
        headerName: string;
        jwtSecret?: string;
    };
}
export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, any>;
    timeout?: number;
}
export interface ApiResponse<T = any> {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: T;
    duration: number;
    timestamp: Date;
}
export interface RouteDefinition {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: string;
    middleware?: string[];
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
}
export declare class ApiGateway {
    private readonly logger;
    private readonly configService;
    private config;
    private routes;
    private requestCounts;
    constructor(logger: LoggingService, configService: ConfigService);
    private initializeConfig;
    private initializeRoutes;
    getAllRoutes(): RouteDefinition[];
    proxyRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>>;
}
//# sourceMappingURL=ApiGateway.d.ts.map