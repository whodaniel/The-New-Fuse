/**
 * AI Coder Factory
 * Manages spawning, configuring, and coordinating AI coder instances
 */
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import * as WebSocket from 'ws';
import { AICoderConfiguration, AICoderSpawnRequest, AICoderSpawnResponse, CoordinationStrategy } from '../types/ai-coder-types';
import { A2AService } from '@the-new-fuse/a2a-core';
export interface HeadlessWorkerInstance {
    agentId: string;
    process: ChildProcess;
    port: number;
    websocketClient: WebSocket | null;
    status: 'spawning' | 'ready' | 'busy' | 'error' | 'stopping';
    config: AICoderConfiguration;
    lastActivity: Date;
    currentTask?: string;
    metrics: {
        totalTasks: number;
        successfulTasks: number;
        failedTasks: number;
        averageExecutionTime: number;
        tokensUsed: number;
    };
}
export interface CollaborationSession {
    id: string;
    taskId: string;
    strategy: CoordinationStrategy;
    participants: string[];
    status: 'active' | 'voting' | 'reviewing' | 'completed' | 'failed';
    results: Map<string, any>;
    consensus?: {
        threshold: number;
        votes: Map<string, number>;
        finalDecision?: string;
    };
    createdAt: Date;
    deadline?: Date;
}
export declare class AICoderFactory extends EventEmitter {
    private a2aService?;
    private instances;
    private collaborationSessions;
    private availablePorts;
    private electronAppPath;
    private maxInstances;
    private basePort;
    constructor(a2aService?: A2AService | undefined, electronAppPath?: string);
    /**
     * Initialize available port pool for headless workers
     */
    private initializePortPool;
    /**
     * Find the Electron desktop app path
     */
    private findElectronApp;
    /**
     * Get next available port
     */
    private getNextAvailablePort;
    /**
     * Release a port back to the pool
     */
    private releasePort;
    /**
     * Spawn a new AI coder instance
     */
    spawnAICoderInstance(request: AICoderSpawnRequest): Promise<AICoderSpawnResponse>;
    catch(error: any): {
        agentId: string;
        status: string;
        errors: string[];
    };
}
//# sourceMappingURL=AICoderFactory.d.ts.map