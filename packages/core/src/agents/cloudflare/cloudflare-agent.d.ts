import { LoggingService } from '../../services/LoggingService';
export interface CloudflareConfig {
    apiKey?: string;
    email?: string;
    zoneId?: string;
    baseUrl?: string;
}
export interface CloudflareTask {
    id: string;
    type: 'dns' | 'firewall' | 'ssl' | 'cdn' | 'analytics' | 'cache';
    action: string;
    data: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    created_at: Date;
    completed_at?: Date;
}
export interface CloudflareResponse {
    success: boolean;
    result?: any;
    errors?: string[];
    messages?: string[];
    execution_time: number;
}
export interface DnsRecord {
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV';
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
}
export interface FirewallRule {
    action: 'block' | 'challenge' | 'allow' | 'js_challenge';
    filter: {
        expression: string;
    };
    description?: string;
}
export declare class CloudflareAgent {
    private readonly logger;
    private config;
    private active_tasks;
    private completed_tasks;
    private api_requests_count;
    private last_api_call;
    private rate_limit_remaining;
    constructor(logger: LoggingService);
    /**
     * Initialize Cloudflare connection and validate credentials
     */
    initialize(config?: Partial<CloudflareConfig>): Promise<boolean>;
    /**
     * Process a Cloudflare task
     */
    processTask(task: CloudflareTask): Promise<CloudflareResponse>;
    catch(error: any): void;
}
//# sourceMappingURL=cloudflare-agent.d.ts.map