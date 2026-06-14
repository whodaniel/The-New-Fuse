/**
 * AG-UI Orchestrator for The New Fuse
 *
 * Implements Microsoft's AG-UI protocol to connect AI agents
 * with self-contained visualization generation.
 *
 * Key Features:
 * - Real-time agent communication via WebSocket
 * - Dynamic UI generation from agent outputs
 * - Self-contained HTML artifact creation
 * - Bidirectional state management
 */
import { EventEmitter } from 'events';
import type { WebSocket } from 'ws';
export interface AGUIMessage {
    id: string;
    type: 'request' | 'response' | 'notification' | 'error';
    method?: string;
    params?: any;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface AgentSession {
    id: string;
    agentId: string;
    ws: WebSocket;
    state: Map<string, any>;
    createdAt: Date;
    lastActivity: Date;
}
export interface VisualizationRequest {
    type: 'agent-flow' | 'service-map' | 'workflow-deps' | 'bundle-analysis' | 'monitoring';
    data: any;
    title: string;
    aiInsights?: string;
    metadata?: Record<string, any>;
}
export interface VisualizationResult {
    success: boolean;
    filePath?: string;
    html?: string;
    error?: string;
}
export declare class AGUIOrchestrator extends EventEmitter {
    private port;
    private wss;
    private sessions;
    private messageHandlers;
    constructor(port?: number);
    /**
     * Start the AG-UI WebSocket server
     */
    start(): void;
    /**
     * Stop the AG-UI server
     */
    stop(): void;
    /**
     * Handle incoming AG-UI protocol messages
     */
    private handleMessage;
    /**
     * Send response to agent
     */
    private sendResponse;
    /**
     * Send error to agent
     */
    private sendError;
    /**
     * Send notification to agent
     */
    sendNotification(sessionId: string, method: string, params: any): void;
    /**
     * Register a method handler
     */
    registerHandler(method: string, handler: (params: any, session: AgentSession) => Promise<any>): void;
    /**
     * Register default AG-UI protocol handlers
     */
    private registerDefaultHandlers;
    /**
     * Generate self-contained visualization
     */
    private generateVisualization;
    /**
     * Get all active sessions
     */
    getSessions(): AgentSession[];
    /**
     * Get session by ID
     */
    getSession(sessionId: string): AgentSession | undefined;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
export default AGUIOrchestrator;
//# sourceMappingURL=AGUIOrchestrator.d.ts.map