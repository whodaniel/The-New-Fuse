/**
 * Interface for agent messages as specified in the onboarding instructions
 */
interface AgentMessage {
    type: string;
    timestamp: string;
    metadata: {
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
    };
    details?: Record<string, any>;
}
/**
 * Trae Agent implementation for The New Fuse system
 * Handles system verification, registration, and communication
 */
declare class TraeAgent {
    private readonly logger;
    private readonly redis;
    private readonly pubClient;
    private readonly subClient;
    private isRegistered;
    private isConnected;
    private readonly apiEndpoint;
    constructor();
    /**
     * Initialize the Trae Agent
     * 1. Verify system requirements
     * 2. Register with the API
     * 3. Set up communication channels
     * 4. Send initial handshake
     */
    initialize(): Promise<void>;
    /**
     * Verify Redis and environment requirements
     */
    private verifySystemRequirements;
    /**
     * Register the agent with the API
     */
    private registerAgent;
    /**
     * Set up Redis communication channels
     */
    private setupCommunication;
    /**
     * Send initial handshake message to agent:augment channel
     */
    private sendInitialHandshake;
    /**
     * Handle incoming messages from subscribed channels
     */
    private handleMessage;
    /**
     * Handle task assignment messages
     */
    private handleTaskAssignment;
    /**
     * Handle system messages
     */
    private handleSystemMessage;
    /**
     * Send a message to a specific channel
     */
    sendMessage(channel: string, message: AgentMessage): Promise<void>;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
    /**
     * Get connection status
     */
    getStatus(): {
        registered: boolean;
        connected: boolean;
    };
}
export { TraeAgent, AgentMessage };
