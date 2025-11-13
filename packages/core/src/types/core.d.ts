/**
 * @fileoverview Core type definitions for The New Fuse platform
 */
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface Task {
    id: string;
    name: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
    agentId?: string;
    workflowId?: string;
}
export interface LocalAIProvider {
    name: string;
    endpoint: string;
    command?: string;
    checkCommand?: string;
    type: 'ollama' | 'lmstudio' | 'localai' | 'custom';
    models?: string[];
    isAvailable?: boolean;
    lastChecked?: Date;
}
export interface SystemConfig {
    environment: 'development' | 'staging' | 'production' | 'test';
    database: DatabaseConfig;
    redis: RedisConfig;
    monitoring: MonitoringConfig;
    ai: AIConfig;
}
export interface DatabaseConfig {
    url: string;
    maxConnections?: number;
    connectionTimeout?: number;
    queryTimeout?: number;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetries?: number;
}
export interface MonitoringConfig {
    enabled: boolean;
    metricsInterval?: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enablePerformanceTracking?: boolean;
}
export interface AIConfig {
    providers: LocalAIProvider[];
    defaultProvider?: string;
    maxConcurrentRequests?: number;
    requestTimeout?: number;
}
export interface SystemError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
//# sourceMappingURL=core.d.ts.map