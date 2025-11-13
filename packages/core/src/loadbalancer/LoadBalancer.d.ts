import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../monitoring/MetricsService';
export interface ServiceInstance {
    id: string;
    name: string;
    url: string;
    host: string;
    port: number;
    protocol: 'http' | 'https' | 'tcp' | 'udp';
    status: 'healthy' | 'unhealthy' | 'maintenance' | 'unknown';
    weight: number;
    priority: number;
    metadata: {
        version: string;
        region: string;
        zone: string;
        capacity: number;
        tags: string[];
    };
    health_check: {
        enabled: boolean;
        endpoint: string;
        interval_ms: number;
        timeout_ms: number;
        healthy_threshold: number;
        unhealthy_threshold: number;
    };
    metrics: {
        active_connections: number;
        total_requests: number;
        failed_requests: number;
        avg_response_time_ms: number;
        cpu_usage: number;
        memory_usage: number;
        last_request_at?: Date;
    };
    registered_at: Date;
    last_health_check: Date;
    consecutive_failures: number;
    consecutive_successes: number;
}
export interface LoadBalancingRule {
    id: string;
    name: string;
    service_pattern: string;
    algorithm: 'round_robin' | 'weighted_round_robin' | 'least_connections' | 'ip_hash' | 'random' | 'least_response_time';
    sticky_sessions: boolean;
    session_affinity_cookie?: string;
    failover_enabled: boolean;
    circuit_breaker: {
        enabled: boolean;
        failure_threshold: number;
        recovery_timeout_ms: number;
        half_open_max_calls: number;
    };
    rate_limiting: {
        enabled: boolean;
        requests_per_minute: number;
        burst_size: number;
    };
    retry_policy: {
        enabled: boolean;
        max_retries: number;
        retry_delay_ms: number;
        retry_on_status_codes: number[];
    };
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface LoadBalancerRequest {
    id: string;
    client_ip: string;
    service_name: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    user_agent: string;
    session_id?: string;
    requested_at: Date;
    routed_to?: string;
    response_time_ms?: number;
    status_code?: number;
    error_message?: string;
}
export interface CircuitBreakerState {
    service_id: string;
    state: 'closed' | 'open' | 'half_open';
    failure_count: number;
    last_failure_time?: Date;
    next_retry_time?: Date;
    half_open_calls: number;
}
export interface LoadBalancerMetrics {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time_ms: number;
    requests_per_second: number;
    active_services: number;
    healthy_services: number;
    unhealthy_services: number;
    circuit_breakers_open: number;
    load_distribution: Record<string, number>;
    error_rates: Record<string, number>;
    top_errors: Array<{
        error: string;
        count: number;
    }>;
    last_updated: Date;
}
export declare class LoadBalancer {
    private readonly logger;
    private readonly metricsService;
    private services;
    private rules;
    private requests;
    private circuitBreakers;
    private sessionAffinityMap;
    private roundRobinCounters;
    private isInitialized;
    private healthCheckInterval?;
    constructor(logger: LoggingService, metricsService: MetricsService);
    initialize(): Promise<void>;
    registerService(serviceName: string, host: string, port: number, options?: {
        protocol?: ServiceInstance['protocol'];
        weight?: number;
        priority?: number;
        metadata?: Partial<ServiceInstance['metadata']>;
        health_check?: Partial<ServiceInstance['health_check']>;
    }): Promise<ServiceInstance>;
    unregisterService(serviceName: string, serviceId: string): Promise<boolean>;
    createRule(name: string, description: string, servicePattern: string, algorithm: LoadBalancingRule['algorithm'], options?: {
        sticky_sessions?: boolean;
        session_affinity_cookie?: string;
        failover_enabled?: boolean;
        circuit_breaker?: Partial<LoadBalancingRule['circuit_breaker']>;
        rate_limiting?: Partial<LoadBalancingRule['rate_limiting']>;
        retry_policy?: Partial<LoadBalancingRule['retry_policy']>;
    }): Promise<LoadBalancingRule>;
    if(rule: any, rate_limiting: any, enabled: any): any;
}
export default LoadBalancer;
//# sourceMappingURL=LoadBalancer.d.ts.map