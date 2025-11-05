import { Logger } from '@nestjs/common';
import { MCPServer, MCPToolParams, MCPServerOptions } from './types';
import { FileCreationCoordinationService } from '../vscode-extension/src/coordination/FileCreationCoordinationService';
import { FileCoordinationManager } from '../vscode-extension/src/coordination/FileCoordinationManager';
/**
 * MCP Server for File Creation Coordination System
 *
 * This server exposes file coordination capabilities through the MCP protocol,
 * allowing agents to coordinate file creation activities across the system.
 */
export declare class MCPFileCoordinationServer extends MCPServer {
    private readonly coordinationService;
    private readonly coordinationManager;
    protected readonly logger: Logger;
    constructor(coordinationService: FileCreationCoordinationService, coordinationManager: FileCoordinationManager, options?: MCPServerOptions);
    /**
     * Initialize MCP tools for file coordination
     */
    private initializeTools;
    getConfiguration(): Promise<any>;
    updateConfiguration(params: {
        config: any;
    }): Promise<any>;
    getActiveSessions(): Promise<any>;
    getSession(params: {
        sessionId: string;
    }): Promise<any>;
    getSessionHistory(params: {
        page?: number;
        limit?: number;
        status?: string;
        agentId?: string;
    }): Promise<any>;
    getParticipants(): Promise<any>;
    registerParticipant(params: {
        agentId: string;
        agentName: string;
        capabilities: string[];
        priority: number;
        metadata?: any;
    }): Promise<any>;
    unregisterParticipant(params: {
        agentId: string;
    }): Promise<any>;
    createFileWithCoordination(params: {
        filePath: string;
        content?: string;
        triggerCoordination?: boolean;
        metadata?: any;
    }): Promise<any>;
    prepareFileCreation(params: {
        filePath: string;
        fileType: string;
        context?: any;
    }): Promise<any>;
    getCoordinationStats(): Promise<any>;
    getSystemHealth(): Promise<any>;
    sendCoordinationMessage(params: {
        sessionId: string;
        message: string;
        senderId: string;
        messageType?: string;
    }): Promise<any>;
    getCoordinationMessages(params: {
        sessionId: string;
        limit?: number;
    }): Promise<any>;
    getTemplatesForFile(params: {
        fileExtension: string;
        context?: any;
    }): Promise<any>;
    analyzeFileContext(params: {
        filePath: string;
        analyzeDepth?: number;
    }): Promise<any>;
    simulateCoordination(params: {
        filePath: string;
        participants?: string[];
    }): Promise<any>;
    optimizeParticipantOrder(params: {
        participants: string[];
        fileContext?: any;
    }): Promise<any>;
    /**
     * Get available MCP tools for this server
     */
    getTools(): Record<string, MCPToolParams>;
}
//# sourceMappingURL=MCPFileCoordinationServer.d.ts.map