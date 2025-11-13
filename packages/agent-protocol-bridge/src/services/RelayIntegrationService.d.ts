/**
 * RelayIntegrationService
 * Integrates the enhanced TNF relay with the backend AgentHub
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentHub } from './AgentHub';
/**
 * Service that bridges the gap between the enhanced TNF relay and the backend AgentHub
 *
 * Features:
 * - WebSocket connection management to enhanced TNF relay
 * - Message translation between relay and AgentHub protocols
 * - Agent registration bridging
 * - Task execution routing
 * - Chrome extension integration
 * - Session management for AI automation
 * - Error handling and retry mechanisms
 * - Health monitoring and auto-reconnection
 *
 * Environment Variables:
 * - TNF_RELAY_WS_URL: WebSocket URL for the relay (default: ws://localhost:3001)
 * - TNF_RELAY_HTTP_PORT: HTTP port for the relay server (default: 3007)
 * - TNF_RELAY_WS_PORT: WebSocket port for the relay server (default: 3001)
 */
export declare class RelayIntegrationService implements OnModuleInit, OnModuleDestroy {
    private readonly agentHub;
    private readonly eventEmitter;
    private readonly logger;
    private relayWebSocket;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private isConnected;
    private messageQueue;
    private registeredAgents;
    private activeSessions;
    private heartbeatInterval;
    constructor(agentHub: AgentHub, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Connect to the enhanced TNF relay WebSocket server
     */
    private connectToRelay;
    /**
     * Handle agent registration from relay
     */
    private handleAgentRegistration;
    /**
     * Handle error messages from relay
     */
    private handleErrorMessage;
    /**
     * Disconnect from relay
     */
    private disconnect;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
//# sourceMappingURL=RelayIntegrationService.d.ts.map