/**
 * VSCode Agent Communication Bridge Service
 * Enables seamless bidirectional communication between AI agents and VSCode extensions
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class VSCodeAgentCommunicationBridge {
    private readonly eventEmitter;
    private readonly logger;
    private wss;
    private extensionConnections;
    private messageHandlers;
    private heartbeatInterval;
    private bridgeConfig;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Initialize the WebSocket server for VSCode extension communication
     */
    private initializeCommunicationBridge;
    /**
     * Handle incoming messages from VSCode extensions
     */
    private handleExtensionMessage;
    private handleExtensionResponse;
}
//# sourceMappingURL=vscode-agent-communication-bridge.service.d.ts.map