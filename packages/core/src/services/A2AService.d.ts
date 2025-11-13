import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggingService } from './LoggingService';
import { MetricsService } from './MetricsService';
export interface A2AAgent {
    id: string;
    name: string;
    type: 'ai' | 'human' | 'system';
    capabilities: string[];
    endpoint: string;
    status: 'active' | 'inactive' | 'connecting' | 'error';
    lastSeenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
    lastSeen?: Date;
    version?: string;
    uptime?: number;
    memoryUsage?: {
        used: number;
        total: number;
    };
    cpuUsage?: number;
    messageQueue?: {
        size: number;
        pending: number;
    };
    activeConnections?: number;
    errorRate?: number;
    responseTime?: number;
}
export interface A2ACapability {
    id: string;
    name: string;
    description: string;
    version: string;
    parameters?: Record<string, any>;
    requirements?: string[];
}
export interface A2AMessage {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    type: 'request' | 'response' | 'notification' | 'heartbeat';
    payload: any;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    ttl?: number;
    createdAt: Date;
    expiresAt?: Date;
}
export interface A2AConnection {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    status: 'pending' | 'established' | 'failed' | 'closed';
    establishedAt?: Date;
    lastActivityAt?: Date;
    metadata?: Record<string, any>;
}
export interface CreateAgentDto {
    name: string;
    type: 'ai' | 'human' | 'system';
    capabilities: string[];
    endpoint: string;
    metadata?: Record<string, any>;
}
export interface UpdateAgentDto {
    name?: string;
    type?: 'ai' | 'human' | 'system';
    capabilities?: string[];
    endpoint?: string;
    status?: 'active' | 'inactive' | 'connecting' | 'error';
    metadata?: Record<string, any>;
}
export interface AgentFilter {
    type?: 'ai' | 'human' | 'system';
    status?: 'active' | 'inactive' | 'connecting' | 'error';
    capability?: string;
    search?: string;
}
export interface A2AStats {
    totalAgents: number;
    activeAgents: number;
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    messagesThisHour: number;
    agentsByType: Record<string, number>;
    agentsByStatus: Record<string, number>;
}
export declare class A2AService {
    private readonly loggingService;
    private readonly metricsService;
    private readonly eventEmitter;
    private agents;
    private connections;
    private messages;
    private capabilities;
    private agentNameIndex;
    constructor(loggingService: LoggingService, metricsService: MetricsService, eventEmitter: EventEmitter2);
    private initializeDefaultCapabilities;
    registerAgent(createAgentDto: CreateAgentDto): Promise<A2AAgent>;
    const agent: A2AAgent;
}
export default A2AService;
//# sourceMappingURL=A2AService.d.ts.map