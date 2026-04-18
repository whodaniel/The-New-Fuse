import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import { HitEvent } from '../types/events.js';

interface AgentConfig {
  name: string;
  tty?: string;
  keywords: string[];
}

interface PendingMessage {
  targetAgent: string;
  text: string;
  startTime: number;
}

export class AgentRouter extends EventEmitter {
  private agents: Map<string, AgentConfig> = new Map();
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private messageBuffer: Map<string, string[]> = new Map();

  constructor() {
    super();

    this.agents.set('echo', {
      name: 'echo',
      tty: process.env.ECHO_TTY || 'ttys095',
      keywords: ['echo', 'kilo one', 'agent alpha'],
    });

    this.agents.set('pulse', {
      name: 'pulse',
      tty: process.env.PULSE_TTY,
      keywords: ['pulse', 'kilo two', 'agent beta'],
    });

    this.agents.set('router', {
      name: 'router',
      tty: process.env.ROUTER_TTY,
      keywords: ['router', 'switch'],
    });

    this.log('AgentRouter initialized with agents:', Array.from(this.agents.keys()));
  }

  processHit(hit: HitEvent, fullText: string, streamId: string): void {
    if (hit.groupId === 'agent_route') {
      const agent = this.detectAgent(hit.termId);
      if (agent) {
        this.log(`Detected agent keyword: ${hit.termId} -> ${agent}`);

        if (agent === 'all') {
          this.log('Broadcast requested');
        }

        const pending = this.pendingMessages.get(streamId) || {
          targetAgent: agent,
          text: '',
          startTime: hit.tsStartMs,
        };
        pending.text = fullText;
        this.pendingMessages.set(streamId, pending);
      }
    }

    if (hit.groupId === 'protocol') {
      const pending = this.pendingMessages.get(streamId);
      if (pending) {
        if (hit.termId === 'proto_over' || hit.termId === 'proto_out') {
          this.log(`Protocol keyword detected: ${hit.termId}, routing message`);

          if (pending.targetAgent === 'all') {
            this.broadcast(pending.text);
          } else {
            this.routeToAgent(pending.targetAgent, pending.text);
          }

          this.pendingMessages.delete(streamId);
        }
      }
    }
  }

  private detectAgent(termId: string): string | null {
    if (termId.startsWith('agent_echo')) return 'echo';
    if (termId.startsWith('agent_pulse')) return 'pulse';
    if (termId === 'agent_all') return 'all';
    if (termId === 'agent_router') return 'router';
    return null;
  }

  private routeToAgent(agent: string, message: string): void {
    const config = this.agents.get(agent);
    if (!config) {
      this.log(`Unknown agent: ${agent}`);
      return;
    }

    this.log(`Routing to ${agent}: ${message.slice(0, 60)}...`);

    if (config.tty) {
      this.injectToTty(config.tty, message);
    } else {
      this.log(`No TTY configured for ${agent}, queuing message`);
      const queue = this.messageBuffer.get(agent) || [];
      queue.push(message);
      this.messageBuffer.set(agent, queue);
    }

    this.emit('routed', { agent, message, tty: config.tty });
  }

  private broadcast(message: string): void {
    this.log(`Broadcasting to all agents: ${message.slice(0, 60)}...`);

    for (const [name, config] of this.agents) {
      if (config.tty) {
        this.injectToTty(config.tty, `[BROADCAST] ${message}`);
      }
    }

    this.emit('broadcast', { message });
  }

  private injectToTty(tty: string, message: string): void {
    const ttyPath = `/dev/${tty}`;
    try {
      fs.writeFileSync(ttyPath, message + '\n');
      this.log(`Injected to ${tty}: success`);
    } catch (err) {
      this.log(`Failed to inject to ${tty}:`, err);
    }
  }

  registerAgent(name: string, config: AgentConfig): void {
    this.agents.set(name, config);
    this.log(`Registered agent: ${name}`);

    const queued = this.messageBuffer.get(name);
    if (queued && config.tty) {
      this.log(`Flushing ${queued.length} queued messages to ${name}`);
      for (const msg of queued) {
        this.injectToTty(config.tty, msg);
      }
      this.messageBuffer.delete(name);
    }
  }

  private log(...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AgentRouter]`, ...args);
  }
}
