/**
 * File Protocol Communicator
 *
 * This module implements communication between VS Code extensions via shared files
 * in the workspace, as described in the inter-extension communication design document.
 */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
/**
 * Implements communication between extensions using shared files
 */
export declare class FileProtocolCommunicator {
    private context;
    private agentClient;
    private agentId;
    private communicationDir;
    private fileWatcher;
    private secretKey;
    private processedMessageIds;
    private outputChannel;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, outputChannel: vscode.OutputChannel);
    /**
     * Initialize the communicator by setting up file watchers
     */
    initialize(): Promise<boolean>;
    /**
     * Send a message to another extension by writing a file
     */
    sendMessage(recipient: string, action: string, payload: any): Promise<{
        success: boolean;
        messageId?: string;
    }>;
    /**
     * Handle file creation or change events
     */
    private handleFileEvent;
    /**
     * Update a message file with new status
     */
    private updateMessageFile;
    /**
     * Process a message by routing it through the agent client system
     */
    private processMessage;
    /**
     * Sign a message using HMAC
     */
    private signMessage;
    /**
     * Verify a message signature
     */
    private verifyMessage;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
/**
 * Create a file protocol communicator
 */
export declare function createFileProtocolCommunicator(context: vscode.ExtensionContext, agentClient: AgentClient, outputChannel: vscode.OutputChannel): FileProtocolCommunicator;
//# sourceMappingURL=file-protocol-communicator.d.ts.map