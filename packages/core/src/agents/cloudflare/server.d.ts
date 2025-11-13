import { LoggingService } from '../../services/LoggingService';
import { CloudflareAgent } from './cloudflare-agent';
export interface ServerConfig {
    port?: number;
    host?: string;
    ssl?: boolean;
    cors?: boolean;
    rateLimiting?: boolean;
    compression?: boolean;
}
export interface ServerMetrics {
    uptime: number;
    requests_total: number;
    requests_per_second: number;
    response_time_avg: number;
    error_rate: number;
    memory_usage: number;
    cpu_usage: number;
    active_connections: number;
}
export interface ServerHealth {
    status: 'healthy' | 'warning' | 'critical';
    checks: {
        [key: string]: {
            status: 'pass' | 'fail' | 'warn';
            message?: string;
            timestamp: Date;
        };
    };
    last_checked: Date;
}
export interface ServerResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
    execution_time: number;
}
export declare class CloudflareServerAgent {
    private readonly logger;
    private readonly cloudflareAgent;
    private config;
    private metrics;
    private health;
    private start_time;
    private request_count;
    private response_times;
    private error_count;
    private active_connections;
    constructor(logger: LoggingService, cloudflareAgent: CloudflareAgent);
    /**
     * Initialize server configuration
     */
    private initializeConfig;
    /**
     * Initialize server metrics
     */
    private initializeMetrics;
    /**
     * Initialize health checks
     */
    private initializeHealth;
    /**
     * Start the Cloudflare server
     */
    start(): Promise<ServerResponse>;
    catch(error: any): void;
    const memory_usage: NodeJS.MemoryUsage;
    const memory_usage_mb: number;
    checks: any;
    memory_usage: NodeJS.MemoryUsage;
}
export default CloudflareServerAgent;
//# sourceMappingURL=server.d.ts.map