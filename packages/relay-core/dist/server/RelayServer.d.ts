/**
 * Unified Relay Server for The New Fuse Framework
 *
 * Consolidates functionality from:
 * - comprehensive-tnf-relay.js
 * - enhanced-tnf-relay.js
 * - basic-relay.js
 * - relay-adapter.js
 * - message-bridge.js
 */
import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { Agent, InterceptRule, RelayConfig, RelayMessage, SystemStatus } from '../types/index.js';
export declare class RelayServer extends EventEmitter {
    private config;
    private logger;
    private transports;
    private agentRegistry;
    private messageRouter;
    private bridge;
    private protocolTranslator;
    private systemStatus;
    private isRunning;
    private interceptedMessages;
    private orchestratorService;
    private authService;
    private redisService;
    constructor(config: RelayConfig, redisService?: UnifiedRedisService);
    private setupEventHandlers;
    start(): Promise<boolean>;
    stop(): Promise<void>;
    private initializeTransports;
    private startTransports;
    private handleMessage;
    private handleAgentRegistration;
    private handleHeartbeat;
    private handleWorkflowExecution;
    getRelayCapabilities(): string[];
    getSystemStatus(): SystemStatus;
    getAgents(): Agent[];
    getInterceptedMessages(limit?: number): RelayMessage[];
    sendMessage(message: RelayMessage): Promise<boolean>;
    addInterceptRule(hostname: string, rule: InterceptRule): void;
    removeInterceptRule(hostname: string): void;
    private initializeProtocolAdapters;
}
//# sourceMappingURL=RelayServer.d.ts.map