/**
 * Type definitions for Enhanced Communication Hub
 */

export interface AgentInfo {
    id: string;
    name: string;
    platform: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy' | 'idle';
    lastSeen: number;
    sessionId?: string;
    metadata?: {
        version?: string;
        provider?: string;
        features?: string[];
        performance?: {
            responseTime: number;
            reliability: number;
        };
    };
}

export interface SessionInfo {
    id: string;
    name: string;
    participants: AgentInfo[];
    createdAt: number;
    lastActivity: number;
    messageCount: number;
    isActive: boolean;
    platform: string;
}

export interface CommunicationMessage {
    id: string;
    sessionId: string;
    agentId: string;
    content: string;
    timestamp: number;
    type: 'agent' | 'user' | 'system' | 'broadcast';
    direction: 'incoming' | 'outgoing';
    platform?: string;
    metadata?: {
        responseTime?: number;
        tokens?: number;
        model?: string;
        confidence?: number;
    };
}

export interface PerformanceMetrics {
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    messageRate: number;
    errorRate: number;
    uptime: number;
    activeConnections: number;
    throughput: number;
}

export interface FeatureState {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: 'ai' | 'performance' | 'security' | 'integration';
    status: 'healthy' | 'degraded' | 'offline';
    healthStatus?: 'healthy' | 'warning' | 'critical';
    metrics?: {
        usage: number;
        success: number;
        errors: number;
        lastUsed?: Date;
    };
    dependencies?: string[];
}

export interface OptimizationSettings {
    enableAutoOptimization: boolean;
    performanceThreshold: number;
    memoryThreshold: number;
    networkThreshold: number;
    adaptiveOptimization: boolean;
    batchProcessing?: boolean;
    compressionEnabled?: boolean;
}

export interface NetworkConnection {
    type: 'websocket' | 'http' | 'relay';
    url: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    lastPing?: number;
    retryCount: number;
}

export interface HubState {
    agentId: string;
    currentSessionId?: string;
    agents: AgentInfo[];
    sessions: SessionInfo[];
    messages: CommunicationMessage[];
    performanceMetrics: PerformanceMetrics;
    networkConnections: [string, NetworkConnection][];
    features: FeatureState[];
}
