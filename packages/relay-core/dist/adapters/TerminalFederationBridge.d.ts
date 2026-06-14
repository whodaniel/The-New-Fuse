import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';
export interface TerminalFederationConfig {
    tty: string;
    agentName: string;
    role: 'orchestrator' | 'worker' | 'participant';
    platform: string;
}
/**
 * Terminal Federation Bridge
 *
 * Bridges local terminal "Active Pulse" injections with the official TNF Federation protocol.
 * Ensures that even terminal-based agents are registered and visible in the WS Relay.
 */
export declare class TerminalFederationBridge extends EventEmitter {
    private client;
    private logger;
    private config;
    private agentInfo;
    constructor(logger: Logger, config: TerminalFederationConfig);
    /**
     * Register the terminal as an official TNF Agent
     */
    initialize(): Promise<void>;
    /**
     * Record a heartbeat event from the Active Pulse system into the Federation
     */
    recordHeartbeat(heartbeatId: string, status?: string): Promise<void>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=TerminalFederationBridge.d.ts.map