/**
 * Base service class providing common functionality for all agent services
 */
import { EventEmitter } from 'events';
export interface ServiceConfig {
    name: string;
    enabled?: boolean;
    [key: string]: any;
}
export interface ServiceStatus {
    name: string;
    status: 'running' | 'stopped' | 'error' | 'initializing';
    uptime?: number;
    lastError?: string;
    metadata?: Record<string, any>;
}
export declare abstract class BaseService extends EventEmitter {
    protected name: string;
    protected config: ServiceConfig;
    protected startTime?: Date;
    protected isRunning: boolean;
    constructor(config: ServiceConfig);
    /**
     * Initialize the service
     */
    initialize(): Promise<void>;
    /**
     * Start the service
     */
    start(): Promise<void>;
    /**
     * Stop the service
     */
    stop(): Promise<void>;
    /**
     * Get service status
     */
    getStatus(): ServiceStatus;
    /**
     * Check if service is running
     */
    get running(): boolean;
    /**
     * Get service name
     */
    get serviceName(): string;
    /**
     * Override in subclasses for custom initialization logic
     */
    protected onInitialize(): Promise<void>;
    /**
     * Override in subclasses for custom start logic
     */
    protected onStart(): Promise<void>;
    /**
     * Override in subclasses for custom stop logic
     */
    protected onStop(): Promise<void>;
    /**
     * Override in subclasses to provide additional status metadata
     */
    protected getStatusMetadata(): Record<string, any>;
}
//# sourceMappingURL=BaseService.d.ts.map