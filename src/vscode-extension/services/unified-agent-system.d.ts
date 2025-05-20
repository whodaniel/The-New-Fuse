import { ConnectionStatus } from '../types/shared.js';
/**
 * Unified Agent System that consolidates functionality from:
 * - agent-communication.ts/tsx
 * - agent-communication-simple.ts/tsx
 * - ai-collaboration.ts/tsx
 * - ai-collaboration-simple.ts/tsx
 */
export declare class UnifiedAgentSystem {
    private logger;
    private disposables;
    private agents;
    private connectionStatus;
    private statusBarItem;
    private eventEmitter;
    private activeSessions;
    constructor();
    /**
     * Register agent system commands
     */
    private registerCommands;
    /**
     * Discover available agents
     */
    private discoverAgents;
    /**
     * Connect to a specific agent
     */
    connectToAgent(agentId: string): Promise<boolean>;
    /**
     * Disconnect from a specific agent
     */
    disconnectFromAgent(agentId: string): Promise<boolean>;
    /**
     * Start a collaboration session with an agent
     */
    startCollaborationSession(agentId: string, topic: string): Promise<string | null>;
    /**
     * End a collaboration session
     */
    endCollaborationSession(sessionId: string): Promise<boolean>;
    /**
     * Send a message to an agent
     */
    sendMessageToAgent(agentId: string, message: string, sessionId?: string): Promise<boolean>;
    /**
     * Simulate an agent message (for demo purposes)
     */
    private simulateAgentMessage;
    /**
     * Simulate an agent response to a user message
     */
    private simulateAgentResponse;
    /**
     * Get HTML for the collaboration webview
     */
    private getCollaborationHtml;
    /**
     * Update status bar item text
     */
    private updateStatusBarItem;
    /**
     * Update the connection status text based on connected agents
     */
    private updateConnectionStatus;
    /**
     * Add event listener for agent system events
     */
    on(event: string, listener: (...args: any[]) => void): this;
    /**
     * Remove event listener
     */
    off(event: string, listener: (...args: any[]) => void): this;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
/**
 * Information about an agent
 */
export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    description?: string;
    capabilities: string[];
    status: ConnectionStatus;
}
/**
 * Agent collaboration session
 */
export interface AgentSession {
    id: string;
    agentId: string;
    agentName: string;
    topic: string;
    startTime: Date;
    messages: SessionMessage[];
}
/**
 * Message in a collaboration session
 */
export interface SessionMessage {
    id: string;
    sender: 'user' | 'agent';
    content: string;
    timestamp: Date;
}
/**
 * Create and initialize the unified agent system
 */
export declare function createUnifiedAgentSystem(): UnifiedAgentSystem;
//# sourceMappingURL=unified-agent-system.d.ts.map