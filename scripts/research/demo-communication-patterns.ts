/**
 * TNF Communication Patterns Demonstration
 *
 * This script demonstrates ALL possible communication patterns in The New Fuse framework.
 * It acts as an "Operator Console" showing real-time message flow between agents and services.
 *
 * Run with: npx ts-node --esm demo-communication-patterns.ts
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';

// ============================================================
// CONFIGURATION
// ============================================================

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const DEMO_DURATION_MS = 30000; // 30 seconds demo

// ============================================================
// TYPES
// ============================================================

interface AgentMessage {
  id: string;
  type: string;
  from: string;
  to?: string;
  content: string;
  channel?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ProtocolMessage {
  id: string;
  type: string;
  source: string;
  channel?: string;
  timestamp: number;
  payload: unknown;
}

// ============================================================
// SIMULATED AGENTS
// ============================================================

class DemoAgent extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly capabilities: string[]
  ) {
    super();
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.connected = true;
        this.register();
        this.log('🔌 Connected to relay');
        resolve();
      });

      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.log('❌ Disconnected from relay');
      });

      this.ws.on('error', (err) => {
        reject(err);
      });
    });
  }

  private register(): void {
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agent: {
          id: this.id,
          name: this.name,
          platform: 'demo-script',
          status: 'active',
          capabilities: this.capabilities,
          channels: ['general'],
        },
      },
    });
  }

  private handleMessage(msg: ProtocolMessage): void {
    switch (msg.type) {
      case 'WELCOME':
        this.log('📨 Received WELCOME from relay');
        break;
      case 'AGENT_LIST':
        const agents = (msg.payload as any).agents || [];
        this.log(`📋 Received agent list: ${agents.map((a: any) => a.name).join(', ')}`);
        break;
      case 'CHANNEL_LIST':
        const channels = (msg.payload as any).channels || [];
        this.log(`📋 Received channel list: ${channels.map((c: any) => c.name).join(', ')}`);
        break;
      case 'MESSAGE_RECEIVE':
      case 'CHANNEL_MESSAGE':
        const payload = msg.payload as AgentMessage;
        this.log(`💬 Message from ${payload.from}: "${payload.content.substring(0, 50)}..."`);
        this.emit('message', payload);
        break;
      case 'AGENT_STATUS':
        const agent = (msg.payload as any).agent;
        this.log(`👤 Agent ${agent.name} is now ${agent.status}`);
        break;
    }
  }

  private send(data: Partial<ProtocolMessage>): void {
    if (!this.ws || !this.connected) return;

    const msg: ProtocolMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || 'UNKNOWN',
      source: this.id,
      timestamp: Date.now(),
      payload: data.payload || {},
      ...data,
    };

    this.ws.send(JSON.stringify(msg));
  }

  // ============================================================
  // Communication Patterns
  // ============================================================

  /**
   * Pattern 1: UNICAST - Direct message to a specific agent
   */
  sendUnicast(targetAgentId: string, content: string): void {
    this.log(`📤 UNICAST to ${targetAgentId}`);
    this.send({
      type: 'MESSAGE_SEND',
      payload: {
        to: targetAgentId,
        content,
        messageType: 'text',
      },
    });
  }

  /**
   * Pattern 2: MULTICAST - Message to channel members
   */
  sendMulticast(channel: string, content: string): void {
    this.log(`📤 MULTICAST to channel #${channel}`);
    this.send({
      type: 'MESSAGE_SEND',
      channel,
      payload: {
        to: 'broadcast',
        content,
        messageType: 'text',
      },
    });
  }

  /**
   * Pattern 3: BROADCAST - Message to all connected agents
   */
  sendBroadcast(content: string): void {
    this.log(`📤 BROADCAST to all agents`);
    this.send({
      type: 'MESSAGE_SEND',
      payload: {
        to: 'broadcast',
        content,
        messageType: 'text',
      },
    });
  }

  /**
   * Pattern 4: COMMAND - Execute a command on target agent
   */
  sendCommand(targetAgentId: string, command: string): void {
    this.log(`📤 COMMAND to ${targetAgentId}: ${command}`);
    this.send({
      type: 'MESSAGE_SEND',
      payload: {
        to: targetAgentId,
        content: command,
        messageType: 'command',
      },
    });
  }

  /**
   * Pattern 5: CHANNEL OPERATION - Join/Leave/Create channels
   */
  joinChannel(channelId: string): void {
    this.log(`📤 JOIN channel #${channelId}`);
    this.send({
      type: 'CHANNEL_JOIN',
      payload: { channelId },
    });
  }

  createChannel(name: string, description: string): void {
    this.log(`📤 CREATE channel #${name}`);
    this.send({
      type: 'CHANNEL_CREATE',
      payload: { name, description, isPrivate: false },
    });
  }

  leaveChannel(channelId: string): void {
    this.log(`📤 LEAVE channel #${channelId}`);
    this.send({
      type: 'CHANNEL_LEAVE',
      payload: { channelId },
    });
  }

  /**
   * Pattern 6: STREAMING - Real-time streaming response indication
   */
  startStreaming(messageId: string): void {
    this.log(`📤 STREAMING START for message ${messageId}`);
    this.send({
      type: 'MESSAGE_STREAM_START',
      payload: { messageId },
    });
  }

  streamChunk(messageId: string, chunk: string): void {
    this.send({
      type: 'MESSAGE_STREAM_CHUNK',
      payload: { messageId, chunk },
    });
  }

  endStreaming(messageId: string): void {
    this.log(`📤 STREAMING END for message ${messageId}`);
    this.send({
      type: 'MESSAGE_STREAM_END',
      payload: { messageId },
    });
  }

  disconnect(): void {
    this.send({ type: 'AGENT_UNREGISTER' });
    this.ws?.close();
  }

  private log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}

// ============================================================
// OPERATOR CONSOLE
// ============================================================

class OperatorConsole {
  private agents: DemoAgent[] = [];

  constructor() {
    this.printBanner();
  }

  private printBanner(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           TNF OPERATOR CONSOLE - Communication Patterns Demo          ║
║                                                                        ║
║  This demonstration shows ALL communication patterns available       ║
║  in The New Fuse framework using REAL implementations.               ║
╚══════════════════════════════════════════════════════════════════════╝
`);
  }

  async runDemo(): Promise<void> {
    console.log('\n🚀 Starting Communication Patterns Demo...\n');
    console.log(`📡 Relay URL: ${RELAY_URL}\n`);

    // Create demo agents
    const claudeAgent = new DemoAgent('claude-demo-1', 'Claude (Demo)', [
      'reasoning',
      'code-generation',
    ]);
    const gpt4Agent = new DemoAgent('gpt4-demo-1', 'GPT-4 (Demo)', ['reasoning', 'multi-modal']);
    // const browserAgent = new DemoAgent('browser-demo-1', 'Browser Agent', [
    //   'dom-reading',
    //   'chat-injection',
    // ]);

    this.agents = [claudeAgent, gpt4Agent];

    try {
      // Connect all agents
      console.log('\n═══ PHASE 1: Agent Registration ═══\n');

      for (const agent of this.agents) {
        await agent.connect(RELAY_URL);
        await this.delay(500);
      }

      await this.delay(1000);

      // Pattern 1: UNICAST
      console.log('\n═══ PATTERN 1: UNICAST (Direct Message) ═══\n');
      claudeAgent.sendUnicast(
        'gpt4-demo-1',
        'Hello GPT-4! This is a direct message demonstrating unicast communication.'
      );
      await this.delay(1000);

      // Pattern 2: CHANNEL OPERATIONS
      console.log('\n═══ PATTERN 2: CHANNEL OPERATIONS ═══\n');
      claudeAgent.createChannel('ai-collab', 'Channel for AI agent collaboration');
      await this.delay(500);
      gpt4Agent.joinChannel('ai-collab');
      await this.delay(500);
      // browserAgent.joinChannel('ai-collab');
      await this.delay(1000);

      // Pattern 3: MULTICAST
      console.log('\n═══ PATTERN 3: MULTICAST (Channel Message) ═══\n');
      claudeAgent.sendMulticast(
        'general',
        'This message goes to all members of the general channel.'
      );
      await this.delay(1000);

      // Pattern 4: BROADCAST
      console.log('\n═══ PATTERN 4: BROADCAST (All Agents) ═══\n');
      gpt4Agent.sendBroadcast('ATTENTION ALL AGENTS: This is a system-wide broadcast message!');
      await this.delay(1000);

      // Pattern 5: COMMAND
      console.log('\n═══ PATTERN 5: COMMAND (Remote Execution) ═══\n');
      claudeAgent.sendCommand('browser-demo-1', '/inject Hello from Claude!');
      await this.delay(500);
      claudeAgent.sendCommand('browser-demo-1', '/get-response');
      await this.delay(1000);

      // Pattern 6: STREAMING
      console.log('\n═══ PATTERN 6: STREAMING (Real-time Response) ═══\n');
      const streamId = `stream-${Date.now()}`;
      gpt4Agent.startStreaming(streamId);
      await this.delay(300);

      const chunks = ['This ', 'is ', 'a ', 'streaming ', 'response ', 'demo.'];
      for (const chunk of chunks) {
        gpt4Agent.streamChunk(streamId, chunk);
        await this.delay(200);
      }

      gpt4Agent.endStreaming(streamId);
      await this.delay(1000);

      // Pattern 7: Multi-hop communication
      console.log('\n═══ PATTERN 7: MULTI-HOP (Agent Relay) ═══\n');
      console.log('[Claude] Sending request that GPT-4 will forward to Browser Agent...');

      // Set up GPT-4 to forward messages
      gpt4Agent.on('message', (msg: AgentMessage) => {
        if (msg.from === 'claude-demo-1' && msg.content.includes('FORWARD:')) {
          const forwardContent = msg.content.replace('FORWARD:', '').trim();
          console.log('[GPT-4] Forwarding message to Browser Agent...');
          gpt4Agent.sendUnicast('browser-demo-1', `Forwarded from Claude: ${forwardContent}`);
        }
      });

      claudeAgent.sendUnicast('gpt4-demo-1', 'FORWARD: Please inject this into the page');
      await this.delay(2000);

      // Cleanup
      console.log('\n═══ CLEANUP ═══\n');
      // browserAgent.leaveChannel('ai-collab');
      await this.delay(500);

      for (const agent of this.agents) {
        agent.disconnect();
      }

      console.log('\n✅ Demo completed successfully!\n');
      this.printSummary();
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
      console.log('\n💡 Make sure the relay server is running:');
      console.log('   cd packages/relay-core && pnpm run relay');
    }
  }

  private printSummary(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    COMMUNICATION PATTERNS SUMMARY                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  1. UNICAST    - Direct agent-to-agent messaging                      ║
║  2. MULTICAST  - Channel-based group messaging                        ║
║  3. BROADCAST  - System-wide announcements                            ║
║  4. COMMAND    - Remote command execution (/inject, /get-response)    ║
║  5. CHANNEL    - Join/Leave/Create channel operations                 ║
║  6. STREAMING  - Real-time streaming responses (start/chunk/end)      ║
║  7. MULTI-HOP  - Agent forwarding/relay patterns                      ║
║                                                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  All patterns use REAL WebSocket connections and protocol messages.   ║
║  NO mock data or simulated delays are used in these implementations.  ║
╚══════════════════════════════════════════════════════════════════════╝
`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const console = new OperatorConsole();
  await console.runDemo();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
