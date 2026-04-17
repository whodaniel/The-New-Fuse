import { EventEmitter } from 'events';
// @ts-ignore
import { RedisAgentClient } from '../../../tnf-cli/src/RedisAgentClient';
/**
 * Terminal Federation Bridge
 *
 * Bridges local terminal "Active Pulse" injections with the official TNF Federation protocol.
 * Ensures that even terminal-based agents are registered and visible in the WS Relay.
 */
export class TerminalFederationBridge extends EventEmitter {
    constructor(logger, config) {
        super();
        this.agentInfo = null;
        this.logger = logger;
        this.config = config;
        this.client = new RedisAgentClient();
    }
    /**
     * Register the terminal as an official TNF Agent
     */
    async initialize() {
        try {
            await this.client.initialize();
            this.agentInfo = await this.client.register(this.config.agentName, this.config.role, this.config.platform, ['terminal_injection', 'active_pulse']);
            this.logger.info(`[Federation] Terminal ${this.config.tty} federated as ${this.agentInfo.id}`);
            // Listen for incoming commands directed at this terminal
            this.client.onMessage('command', (msg) => {
                this.emit('command', msg);
            });
        }
        catch (error) {
            this.logger.error(`[Federation] Failed to federate terminal ${this.config.tty}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Record a heartbeat event from the Active Pulse system into the Federation
     */
    async recordHeartbeat(heartbeatId, status = 'active') {
        if (!this.agentInfo)
            return;
        await this.client.logActivity('heartbeat_pulse', `Terminal Pulse: ${heartbeatId}`, {
            tty: this.config.tty,
            status,
            heartbeatId,
        });
        // Also send a formal federation heartbeat
        // This makes the agent appear "Online" in the WS Relay / Dashboard
        await this.client.broadcast({
            type: 'heartbeat',
            content: `PULSE: ${heartbeatId}`,
            metadata: {
                tty: this.config.tty,
                heartbeatId,
                federated: true,
            },
        });
    }
    async cleanup() {
        await this.client.cleanup();
    }
}
//# sourceMappingURL=TerminalFederationBridge.js.map