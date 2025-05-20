import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';
/**
 * Interface for an AI agent registration
 */
export interface AIAgentRegistration {
    id: string;
    name: string;
    capabilities: string[];
    version: string;
    provider?: string;
    apiType?: string;
    lastSeen: number;
    active: boolean;
}
/**
 * Interface for a communication log entry
 */
export interface CommunicationLogEntry {
    timestamp: number;
    sender: string;
    recipient: string;
    action: string;
    direction: 'outgoing' | 'incoming';
    successful: boolean;
    error?: string;
}
/**
 * Central hub for coordinating AI agent communication
 */
export declare class InterAIHub {
    private context;
    private agentClient;
    private lmBridge;
    private outputChannel;
    private statusBarItem;
    private communicationLog;
    private agentStatusListeners;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge);
    /**
     * Register commands related to the Inter-AI Hub
     */
    private registerCommands;
    /**
     * Start monitoring for agent updates
     */
    private startAgentMonitoring;
    /**
     * Subscribe to message events
     */
    private subscribeToMessages;
    /**
     * Process an incoming message
     */
    private processIncomingMessage;
    /**
     * Update agent status
     */
    private updateAgentStatus;
    /**
     * Show connected agents in a quick pick
     */
    private showConnectedAgents;
    /**
     * Show actions for a specific agent
     */
    private showAgentActions;
    /**
     * Test connection with an agent
     */
    private testAgentConnection;
    /**
     * Send a custom message to an agent
     */
    private sendCustomMessage;
    /**
     * Show agent capabilities
     */
    private showAgentCapabilities;
    /**
     * Show communication log
     */
    private showCommunicationLog;
    /**
     * Log a communication entry
     */
    private logCommunication;
    /**
     * Add a listener for agent status changes
     */
    onAgentStatusChanged(listener: (agents: AIAgentRegistration[]) => void): vscode.Disposable;
    /**
     * Notify listeners of agent status change
     */
    private notifyAgentStatusListeners;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
export declare function createInterAIHub(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: any): InterAIHub;
//# sourceMappingURL=inter-ai-hub.d.ts.map