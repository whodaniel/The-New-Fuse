import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';

// NOTE: @the-new-fuse/tnf-cli currently does not always ship complete named type exports
// in its built dist artifacts. Use a runtime require plus local structural typing here.
const { RedisAgentClient } = require('@the-new-fuse/tnf-cli');

interface AgentInfo {
  id: string;
  name: string;
  role: 'orchestrator' | 'broker' | 'worker' | 'participant';
  platform: string;
  status: 'active' | 'idle' | 'offline';
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
}

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
  private client: any;
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
      this.client.onMessage('command', (msg: any) => {
        this.emit('command', msg);
      });
    } catch (error) {
      this.logger.error(
        `[Federation] Failed to federate terminal ${this.config.tty}: ${error instanceof Error ? error.message : String(error)}`
      );
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
