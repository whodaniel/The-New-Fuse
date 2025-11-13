/**
 * Agent Federation Terminal Bridge Service
 * Creates seamless integration between AgentFederation and Terminal Orchestration systems
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TerminalDiscoveryService } from './terminal-discovery.service';
import { TerminalMonitorService } from './terminal-monitor.service';
export declare class AgentFederationTerminalBridge {
    private readonly terminalDiscovery;
    private readonly terminalMonitor;
    private readonly eventEmitter;
    private readonly logger;
    private agentBindings;
    private taskQueue;
    private federationConfig;
    private heartbeatTimer;
    private rebalanceTimer;
    constructor(terminalDiscovery: TerminalDiscoveryService, terminalMonitor: TerminalMonitorService, eventEmitter: EventEmitter2);
    /**
     * Initialize the federation bridge with auto-discovery and monitoring
     */
    private initializeFederationBridge;
    catch(error: any): void;
}
//# sourceMappingURL=agent-federation-terminal-bridge.service.d.ts.map