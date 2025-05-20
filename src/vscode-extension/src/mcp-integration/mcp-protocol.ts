import { getLogger, ExtensionLogger } from '../core/logging.js';

export interface MCPMessage {
    type: string;
    payload: any;
    metadata?: Record<string, any>;
}

export interface MCPError extends Error {
    code: string;
    details?: any;
}

export class MCPProtocolHandler {
    private readonly logger: ExtensionLogger;

    private messageHandlers: Map<string, ((message: MCPMessage) => Promise<void>)[]> = new Map();

    constructor() {
        this.logger = getLogger();
    }

    registerHandler(messageType: string, handler: (message: MCPMessage) => Promise<void>): void {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType)!.push(handler);
    }

    async handleMessage(message: MCPMessage): Promise<void> {
        try {
            const handlers = this.messageHandlers.get(message.type) || [];
            
            for (const handler of handlers) {
                await handler(message);
            }
        } catch (error) {
            const mcpError: MCPError = {
                name: 'MCPError',
                message: (error as Error).message,
                code: 'PROTOCOL_ERROR',
                details: error
            };
            throw mcpError;
        }
    }

    createResponse(message: MCPMessage, success: boolean, data?: any): MCPMessage {
        return {
            type: `${message.type}_response`,
            payload: {
                success,
                data,
                requestId: message.metadata?.requestId
            },
            metadata: {
                timestamp: Date.now(),
                ...message.metadata
            }
        };
    }

    createErrorResponse(message: MCPMessage, error: Error | string): MCPMessage {
        return {
            type: `${message.type}_error`,
            payload: {
                success: false,
                error: error instanceof Error ? error.message : error
            },
            metadata: {
                timestamp: Date.now(),
                ...message.metadata
            }
        };
    }
}
