/**
 * NestJS Service for AG-UI Integration
 */
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { VisualizationRequest, VisualizationResult } from '../AGUIOrchestrator.js';
export declare class AGUIService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private orchestrator;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Get all active agent sessions
     */
    getActiveSessions(): {
        id: string;
        agentId: string;
        createdAt: Date;
        lastActivity: Date;
        stateSize: number;
    }[];
    /**
     * Generate visualization programmatically (bypass WebSocket)
     */
    generateVisualization(request: VisualizationRequest): Promise<VisualizationResult>;
    /**
     * Send notification to specific agent
     */
    notifyAgent(sessionId: string, method: string, params: any): void;
    /**
     * Register custom handler
     */
    registerHandler(method: string, handler: (params: any) => Promise<any>): void;
    /**
     * Get service statistics
     */
    getStatistics(): {
        totalSessions: number;
        activeAgents: number;
        oldestSession: number | null;
        averageSessionAge: number;
        uptime: number;
    };
}
//# sourceMappingURL=AGUIService.d.ts.map