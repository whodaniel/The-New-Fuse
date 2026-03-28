import { EventEmitter } from 'events';
import { AgentInfo, RedisAgentClient } from '../../../tnf-cli/src/RedisAgentClient';
import { Logger } from '../utils/Logger';

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
export class TerminalFederationBridge extends EventEmitter {
  private client: RedisAgentClient;
  private logger: Logger;
  private config: TerminalFederationConfig;
  private agentInfo: AgentInfo | null = null;

  constructor(logger: Logger, config: TerminalFederationConfig) {
    super();
    this.logger = logger;
    this.config = config;
    this.client = new RedisAgentClient();
  }

  /**
   * Register the terminal as an official TNF Agent
   */
  async initialize(): Promise<void> {
    try {
      await this.client.initialize();
      this.agentInfo = await this.client.register(
        this.config.agentName,
        this.config.role,
        this.config.platform,
        ['terminal_injection', 'active_pulse']
      );

      this.logger.info(
        `[Federation] Terminal ${this.config.tty} federated as ${this.agentInfo.id}`
      );

      // Listen for incoming commands directed at this terminal
      this.client.onMessage('command', (msg) => {
        this.emit('command', msg);
      });
    } catch (error) {
      this.logger.error(`[Federation] Failed to federate terminal ${this.config.tty}:`, error);
      throw error;
    }
  }

  /**
   * Record a heartbeat event from the Active Pulse system into the Federation
   */
  async recordHeartbeat(heartbeatId: string, status: string = 'active'): Promise<void> {
    if (!this.agentInfo) return;

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

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}
