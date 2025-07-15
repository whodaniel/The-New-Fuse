/**
 * RooCodeCommunication Service
 *
 * Implements the standard communication protocol for interacting with Roo Code
 * based on the Agent Communication Guide patterns.
 */
import { EventEmitter } from 'events';
export type MessageType = 'COLLABORATION_REQUEST' | 'CAPABILITY_DECLARATION' | 'CAPABILITY_ASSESSMENT_REQUEST' | 'REGISTRATION' | 'CERTIFICATION_REQUEST' | 'CERTIFICATION_RESPONSE' | 'MCP_TOOL_INVOCATION' | 'MCP_TOOL_RESPONSE' | 'CODE_COLLABORATION' | 'HEARTBEAT' | 'HEARTBEAT_RESPONSE';
export interface BaseMessage {
    type: MessageType;
    source: string;
    target?: string;
    content: any;
    timestamp: string;
}
export type TaskType = 'code_review' | 'refactoring' | 'file_consolidation' | 'consolidation_analysis' | 'code_generation' | 'system_design';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export declare class RooCodeCommunication extends EventEmitter {
    private agentId;
    private targetAgentId;
    private connected;
    private redisClient;
    private readonly GENERAL_CHANNEL;
    private readonly DIRECT_CHANNEL_PREFIX;
    private readonly BROADCAST_CHANNEL;
    constructor(options: {
        agentId: string;
        targetAgentId: string;
        redisClient?: any;
    });
    /**
     * Initialize the communication service and establish connections
     */
    initialize(): Promise<boolean>;
    /**
     * Register with the Roo Code agent
     */
    private register;
    /**
     * Send a capability declaration
     */
    declareCapabilities(): Promise<void>;
    /**
     * Request a collaboration with Roo Code
     */
    requestCollaboration(taskType: TaskType, taskDetails: any, priority?: Priority): Promise<void>;
    /**
     * Send a code collaboration message
     */
    sendCodeCollaboration(files: {
        path: string;
        content: string;
    }[], focusAreas: string[], priority?: Priority): Promise<void>;
    /**
     * Handle incoming messages from the Redis channels
     */
    private handleIncomingMessage;
    /**
     * Handle a collaboration request
     */
    private handleCollaborationRequest;
    /**
     * Generate a signature for authentication
     */
    private generateSignature;
    /**
     * Disconnect from all channels
     */
    disconnect(): Promise<void>;
    /**
     * Verify connection status
     */
    isConnected(): boolean;
    /**
     * Send a heartbeat (ping) to the target agent
     */
    sendHeartbeat(): Promise<void>;
    /**
     * Send a heartbeat response (pong) to the requesting agent
     */
    private sendHeartbeatResponse;
}
//# sourceMappingURL=RooCodeCommunication.d.ts.map