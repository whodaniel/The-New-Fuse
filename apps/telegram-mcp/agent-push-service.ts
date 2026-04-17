/**
 * TNF Agent Push Service
 *
 * Integrates Telegram messages with TNF's stall-defense and agent registry.
 * When a Telegram message arrives, it's pushed to all registered active agents
 * via the handoff system.
 *
 * Architecture:
 * 1. Telegram daemon logs messages to data/telegram/messages.jsonl
 * 2. AgentPushService watches for new messages
 * 3. New messages are pushed to active agents via TNF handoff protocol
 * 4. Agents receive messages in their context via handoff packets
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

const TNF_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const MESSAGE_LOG = path.join(TNF_ROOT, 'data', 'telegram', 'messages.jsonl');
const REGISTRY_DIR = path.join(TNF_ROOT, 'data', 'telegram', 'registry');
const PUSH_DIR = path.join(TNF_ROOT, 'data', 'telegram', 'push');
const HANDOFF_DIR = path.join(TNF_ROOT, 'data', 'handoff');

export interface TelegramMessage {
  message_id: number;
  chat_id: number;
  text: string;
  from_user: string;
  from_user_id: number;
  date: string;
  timestamp?: string;
  type: string;
  source: string;
}

export interface AgentRegistration {
  agent_id: string;
  registered_at: string;
  last_heartbeat: number;
  session_key?: string;
  channel_id?: string;
}

export class AgentPushService extends EventEmitter {
  private watcher: fs.FSWatcher | null = null;
  private lastPosition: number = 0;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [REGISTRY_DIR, PUSH_DIR, HANDOFF_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Start watching for new Telegram messages
   */
  start(): void {
    console.log('[AgentPushService] Starting message watch...');

    // Read current position
    if (fs.existsSync(MESSAGE_LOG)) {
      const stats = fs.statSync(MESSAGE_LOG);
      this.lastPosition = stats.size;
    }

    // Poll for changes (file watching can be unreliable)
    this.pollInterval = setInterval(() => this.poll(), 2000);

    console.log('[AgentPushService] Watching for new messages...');
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    console.log('[AgentPushService] Stopped');
  }

  /**
   * Poll for new messages
   */
  private poll(): void {
    if (!fs.existsSync(MESSAGE_LOG)) return;

    const stats = fs.statSync(MESSAGE_LOG);
    if (stats.size <= this.lastPosition) return;

    const stream = fs.createReadStream(MESSAGE_LOG, {
      start: this.lastPosition,
      encoding: 'utf8',
    });

    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.forEach((line) => {
        if (line.trim()) {
          try {
            const message: TelegramMessage = JSON.parse(line);
            this.handleNewMessage(message);
          } catch (e) {
            // Skip invalid lines
          }
        }
      });
    });

    stream.on('end', () => {
      this.lastPosition = stats.size;
    });
  }

  /**
   * Handle a new Telegram message
   */
  private handleNewMessage(message: TelegramMessage): void {
    console.log(
      `[AgentPushService] New message from ${message.from_user}: ${message.text.substring(0, 50)}...`
    );

    // Get all active agents
    const agents = this.getActiveAgents();

    if (agents.length === 0) {
      console.log('[AgentPushService] No active agents to push to');
      return;
    }

    // Push to each active agent
    agents.forEach((agent) => {
      this.pushToAgent(agent, message);
    });

    // Emit event for real-time listeners
    this.emit('message', { message, agents });

    console.log(`[AgentPushService] Pushed to ${agents.length} active agents`);
  }

  /**
   * Get all active agents from registry
   */
  private getActiveAgents(): AgentRegistration[] {
    const agents: AgentRegistration[] = [];

    if (!fs.existsSync(REGISTRY_DIR)) return agents;

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    fs.readdirSync(REGISTRY_DIR)
      .filter((f) => f.endsWith('.json'))
      .forEach((file) => {
        try {
          const data = fs.readFileSync(path.join(REGISTRY_DIR, file), 'utf8');
          const agent: AgentRegistration = JSON.parse(data);

          // Check if agent is still active (heartbeat within 5 minutes)
          if (now - agent.last_heartbeat < fiveMinutes) {
            agents.push(agent);
          } else {
            // Remove stale registration
            fs.unlinkSync(path.join(REGISTRY_DIR, file));
            console.log(`[AgentPushService] Removed stale agent: ${agent.agent_id}`);
          }
        } catch (e) {
          // Skip invalid files
        }
      });

    return agents;
  }

  /**
   * Push message to a specific agent
   */
  private pushToAgent(agent: AgentRegistration, message: TelegramMessage): void {
    // Write to agent's push queue (for MCP polling)
    const pushFile = path.join(PUSH_DIR, `${agent.agent_id}.jsonl`);
    fs.appendFileSync(pushFile, JSON.stringify(message) + '\n');

    // Also write a handoff packet if agent has session info
    if (agent.session_key || agent.channel_id) {
      this.writeHandoffPacket(agent, message);
    }
  }

  /**
   * Write a TNF handoff packet for the message
   */
  private writeHandoffPacket(agent: AgentRegistration, message: TelegramMessage): void {
    const packet = {
      id: `telegram-${message.message_id}-${Date.now()}`,
      version: 1,
      fromAgentId: 'telegram-gateway',
      targets: {
        agentIds: [agent.agent_id],
        channelIds: agent.channel_id ? [agent.channel_id] : [],
      },
      priority: 'high',
      scope: {
        tenantId: 'default',
        sessionKey: agent.session_key || 'default',
        workflowId: null,
        channelId: agent.channel_id || null,
      },
      payload: {
        type: 'telegram_message',
        summary: `Telegram from ${message.from_user}: ${message.text.substring(0, 100)}`,
        message: message,
      },
      tags: ['telegram', 'external-message', 'realtime'],
      cumulativeId: {
        scope: {
          tenant_id: 'default',
          session_key: agent.session_key || 'default',
          workflow_id: null,
          channel_id: agent.channel_id || null,
        },
        lineage: {
          correlation_id: `telegram-${message.message_id}`,
          twid: null,
          handoff_packet_id: null,
        },
        federation: {
          gate_decisions: [
            { gate: 'TENANT_SCOPE_GATE', decision: 'allow' },
            { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow' },
            { gate: 'TERMINAL_BINDING_GATE', decision: 'allow' },
            { gate: 'HIGH_RISK_RUNTIME_GATE', decision: 'allow' },
            { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow' },
          ],
        },
      },
      gateDecisions: [
        { gate: 'TENANT_SCOPE_GATE', decision: 'allow' },
        { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow' },
        { gate: 'TERMINAL_BINDING_GATE', decision: 'allow' },
        { gate: 'HIGH_RISK_RUNTIME_GATE', decision: 'allow' },
        { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow' },
      ],
      createdAt: new Date().toISOString(),
    };

    const handoffFile = path.join(HANDOFF_DIR, `${agent.agent_id}-${Date.now()}.json`);
    fs.writeFileSync(handoffFile, JSON.stringify(packet, null, 2));
  }
}

// CLI interface
if (require.main === module) {
  const service = new AgentPushService();

  service.on('message', ({ message, agents }) => {
    console.log(`\n[EVENT] Telegram message delivered to ${agents.length} agents`);
  });

  service.start();

  // Keep running
  process.on('SIGINT', () => {
    service.stop();
    process.exit(0);
  });

  console.log('Agent Push Service running. Press Ctrl+C to stop.');
}
