import { LoggingService } from '../../services/LoggingService';
export interface BridgeConfig {
    maxConnections?: number;
    messageTimeout?: number;
    retryAttempts?: number;
    compression?: boolean;
    encryption?: boolean;
}
export interface BridgeConnection {
    id: string;
    agent_id: string;
    protocol: 'websocket' | 'http' | 'redis' | 'grpc';
    status: 'connected' | 'disconnected' | 'error' | 'connecting';
    last_activity: Date;
    created_at: Date;
    metadata: Record<string, any>;
}
export interface MessageRoute {
    id: string;
    from_agent: string;
    to_agent: string;
    protocol: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: Date;
    last_used: Date;
    success_count: number;
    failure_count: number;
}
export interface BridgeStats {
    total_connections: number;
    active_connections: number;
    messages_processed: number;
    messages_failed: number;
    average_latency: number;
    uptime: number;
}
export declare class AgentBridgeService {
    private readonly logger;
    private config;
    private connections;
    private message_routes;
    private message_queue;
    private processing_queue;
    private stats;
    private start_time;
    constructor(logger: LoggingService);
    /**
     * Initialize bridge configuration
     */
    private initializeConfig;
    /**
     * Initialize bridge statistics
     */
    private initializeStats;
    /**
     * Register an agent connection
     */
    registerConnection(agent_id: string, protocol: BridgeConnection['protocol'], metadata?: Record<string, any>): Promise<string>;
    100: any;
}
//# sourceMappingURL=agent-bridge.service.d.ts.map