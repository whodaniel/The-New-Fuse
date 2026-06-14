/**
 * Unified Agent - Single agent that unifies all capabilities
 *
 * A unified agent that combines:
 * - Enhanced agent capabilities
 * - Bridge integration
 * - BMAD method support
 * - Swarm participation
 * - Protocol compliance (A2A, MCP)
 */
import { EventEmitter } from 'events';
export interface UnifiedAgentConfig {
    id: string;
    name: string;
    role: AgentRole;
    capabilities: string[];
    bridges: BridgeConnection[];
    protocols: SupportedProtocol[];
    swarmConfig?: SwarmConfig;
}
export type AgentRole = 'worker' | 'supervisor' | 'coordinator' | 'specialist' | 'researcher' | 'analyst';
export interface BridgeConnection {
    type: 'universal' | 'redis' | 'protocol' | 'mcp' | 'vscode' | 'electron';
    config?: Record<string, unknown>;
}
export interface SupportedProtocol {
    name: 'a2a' | 'mcp' | 'tnf';
    version: string;
}
export interface SwarmConfig {
    enabled: boolean;
    role: 'leader' | 'follower' | 'peer';
    groupId?: string;
}
export interface TaskRequest {
    id: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    payload: unknown;
    requester: string;
    deadline?: Date;
}
export interface TaskResult {
    taskId: string;
    success: boolean;
    result?: unknown;
    error?: string;
    duration: number;
    metadata: Record<string, unknown>;
}
export interface AgentState {
    status: 'idle' | 'busy' | 'error' | 'offline';
    currentTask?: string;
    queueLength: number;
    lastActivity: Date;
    uptime: number;
}
interface UnifiedAgentMetrics {
    tasksCompleted: number;
    tasksFailed: number;
    totalDuration: number;
    averageDuration: number;
}
export declare class UnifiedAgent extends EventEmitter {
    private config;
    private state;
    private taskQueue;
    private processing;
    private startTime;
    private heartbeatInterval;
    private metrics;
    constructor(config: UnifiedAgentConfig);
    /**
     * Start the agent
     */
    start(): Promise<void>;
    /**
     * Stop the agent
     */
    stop(): Promise<void>;
    /**
     * Get agent info
     */
    getInfo(): {
        id: string;
        name: string;
        role: AgentRole;
        capabilities: string[];
        protocols: SupportedProtocol[];
        state: AgentState;
        metrics: UnifiedAgentMetrics;
    };
    /**
     * Get current state
     */
    getState(): AgentState;
    /**
     * Submit a task
     */
    submitTask(task: TaskRequest): Promise<void>;
    /**
     * Execute a task directly
     */
    executeTask(task: TaskRequest): Promise<TaskResult>;
    /**
     * Process task based on type
     */
    private processTask;
    private handleAnalyze;
    private handleGenerate;
    private handleTransform;
    private handleSearch;
    private handleExecute;
    private handleCustom;
    private delay;
    /**
     * Start processing queue
     */
    private startProcessing;
    /**
     * Send message to another agent
     */
    sendMessage(targetAgent: string, message: unknown, options?: {
        priority?: 'low' | 'medium' | 'high';
        waitForResponse?: boolean;
        timeout?: number;
    }): Promise<unknown>;
    /**
     * Handle incoming message
     */
    handleMessage(from: string, message: unknown): void;
    /**
     * Join a swarm
     */
    joinSwarm(groupId: string): Promise<void>;
    /**
     * Leave swarm
     */
    leaveSwarm(): Promise<void>;
    /**
     * Get swarm status
     */
    getSwarmStatus(): SwarmConfig | null;
    /**
     * Start heartbeat
     */
    private startHeartbeat;
    /**
     * Stop heartbeat
     */
    private stopHeartbeat;
    /**
     * Check capability
     */
    hasCapability(capability: string): boolean;
    /**
     * Add capability
     */
    addCapability(capability: string): void;
    /**
     * Remove capability
     */
    removeCapability(capability: string): void;
}
export declare function createUnifiedAgent(id: string, name: string, role: AgentRole, options?: Partial<UnifiedAgentConfig>): UnifiedAgent;
export default UnifiedAgent;
//# sourceMappingURL=unified_agent.d.ts.map