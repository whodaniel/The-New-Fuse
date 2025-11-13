import { LoggingService } from '../../services/LoggingService';
import { CloudflareAgent } from './cloudflare-agent';
export interface ToolConfig {
    name: string;
    description: string;
    version: string;
    author?: string;
    dependencies?: string[];
    capabilities: string[];
}
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    warnings?: string[];
    execution_time: number;
    tool_name: string;
    timestamp: Date;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    region?: string;
    scaling?: {
        min_instances?: number;
        max_instances?: number;
        cpu_threshold?: number;
    };
    monitoring?: {
        enabled: boolean;
        alerts?: boolean;
        logging_level?: 'debug' | 'info' | 'warn' | 'error';
    };
}
export declare class CloudflareToolsAgent {
    private readonly logger;
    private readonly cloudflareAgent;
    private tools;
    private tool_executions;
    private execution_count;
    constructor(logger: LoggingService, cloudflareAgent: CloudflareAgent);
    /**
     * Initialize available tools
     */
    private initializeTools;
    /**
     * Execute a tool with given parameters
     */
    executeTool(tool_name: string, action: string, parameters?: any): Promise<ToolResult>;
    default: `
        throw new Error(`;
    Unsupported: any;
    firewall: any;
    action: $;
}
//# sourceMappingURL=tools.d.ts.map