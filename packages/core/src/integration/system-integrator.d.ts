import { LoggingService } from '../services/LoggingService';
export interface IntegrationConfig {
    id: string;
    name: string;
    type: IntegrationType;
    status: IntegrationStatus;
    endpoint: string;
    authentication: AuthenticationConfig;
    timeout: number;
    retry_attempts: number;
    rate_limit: RateLimitConfig;
    validation: ValidationConfig;
    transformation: TransformationConfig;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export type IntegrationType = 'rest_api' | 'graphql' | 'websocket' | 'grpc' | 'kafka' | 'redis' | 'database' | 'file_system' | 'email' | 'webhook';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'testing' | 'maintenance' | 'deprecated';
export interface AuthenticationConfig {
    type: 'none' | 'api_key' | 'oauth2' | 'jwt' | 'basic' | 'certificate';
    credentials: Record<string, any>;
    refresh_token?: string;
    expires_at?: Date;
}
export interface RateLimitConfig {
    requests_per_second: number;
    burst_limit: number;
    window_size: number;
    retry_after: number;
}
export interface ValidationConfig {
    input_schema?: object;
    output_schema?: object;
    required_fields: string[];
    optional_fields: string[];
    validation_rules: ValidationRule[];
}
export interface ValidationRule {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
    rules: string[];
    custom_validator?: string;
}
export interface TransformationConfig {
    input_transformation?: TransformationRule[];
    output_transformation?: TransformationRule[];
    data_mapping: DataMappingRule[];
}
export interface TransformationRule {
    field: string;
    operation: 'map' | 'filter' | 'transform' | 'aggregate' | 'validate';
    parameters: Record<string, any>;
}
export interface DataMappingRule {
    source_field: string;
    target_field: string;
    transformation?: string;
    default_value?: any;
    required: boolean;
}
export interface IntegrationRequest {
    id: string;
    integration_id: string;
    operation: string;
    data: any;
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
    timeout?: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    created_at: Date;
}
export interface IntegrationResponse {
    request_id: string;
    integration_id: string;
    success: boolean;
    data?: any;
    error?: IntegrationError;
    metadata: {
        execution_time: number;
        timestamp: Date;
        retry_count: number;
        rate_limit_remaining?: number;
    };
}
export interface IntegrationError {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
    retry_after?: number;
}
export interface IntegrationMetrics {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    error_rate: number;
    current_rate_limit: number;
    last_request_time: Date;
    integration_health: 'healthy' | 'degraded' | 'unhealthy';
}
export interface SystemIntegrationStats {
    total_integrations: number;
    active_integrations: number;
    total_requests: number;
    total_errors: number;
    average_response_time: number;
    integrations_by_type: Record<IntegrationType, number>;
    integrations_by_status: Record<IntegrationStatus, number>;
}
export declare class SystemIntegratorService {
    private readonly logger;
    private integrations;
    private metrics;
    private request_queue;
    private processing_requests;
    private rate_limiters;
    private stats;
    private response_times;
    constructor(logger: LoggingService);
    /**
     * Initialize system statistics
     */
    private initializeStats;
    /**
     * Register a new integration
     */
    registerIntegration(config: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
    if(integration: any, status: any): any;
}
export default SystemIntegratorService;
//# sourceMappingURL=system-integrator.d.ts.map