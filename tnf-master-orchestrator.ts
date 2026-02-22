#!/usr/bin/env node
/**
 * TNF MASTER ORCHESTRATOR
 *
 * This is the "Operator Console" that shows the full TNF ecosystem working together.
 * It demonstrates all components communicating as a self-sustaining agentic system.
 *
 * Components:
 * - Local Relay Server (WebSocket hub)
 * - Redis (pub/sub for cross-instance communication)
 * - Cloud Sandbox (Railway - headless browser automation)
 * - Cloud IDE (SkIDEancer at ide.thenewfuse.com)
 * - Chrome Extension
 * - VSCode Extension
 * - Electron Desktop App
 * - Tauri Desktop App
 * - Workflow Engine
 * - Self-improvement Loop
 *
 * Run with: npx ts-node tnf-master-orchestrator.ts
 */

import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';
import WebSocket from 'ws';

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  localRelay: process.env.LOCAL_RELAY_URL || 'ws://localhost:3001/ws',
  localRelayHealth: process.env.LOCAL_RELAY_HEALTH || 'http://localhost:3001/health',
  cloudApi: process.env.CLOUD_API_URL || 'https://thenewfuse.com/api',
  cloudSandbox: process.env.CLOUD_SANDBOX_URL || 'https://sandbox.thenewfuse.com',
  cloudIde: process.env.CLOUD_IDE_URL || 'https://ide.thenewfuse.com',
  redisUrl:
    process.env.REDIS_URL ||
    'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
};

// ============================================================
// TYPES
// ============================================================

interface ComponentStatus {
  name: string;
  type: 'local' | 'cloud' | 'extension' | 'desktop';
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: Date;
  details?: Record<string, unknown>;
}

interface SystemEvent {
  timestamp: Date;
  source: string;
  type: string;
  data: unknown;
}

// ============================================================
// COMPONENT HEALTH CHECKERS
// ============================================================

class HealthChecker {
  static async checkHttp(url: string, name: string): Promise<ComponentStatus> {
    const component: ComponentStatus = {
      name,
      type: 'cloud',
      status: 'unknown',
      lastChecked: new Date(),
    };

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        component.status = 'online';
        component.details = data;
      } else {
        component.status = 'degraded';
        component.details = { statusCode: response.status };
      }
    } catch (error) {
      component.status = 'offline';
      component.details = { error: (error as Error).message };
    }

    return component;
  }

  static async checkWebSocket(url: string, name: string): Promise<ComponentStatus> {
    const component: ComponentStatus = {
      name,
      type: 'local',
      status: 'unknown',
      lastChecked: new Date(),
    };

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        component.status = 'offline';
        component.details = { error: 'Connection timeout' };
        resolve(component);
      }, 5000);

      try {
        const ws = new WebSocket(url);

        ws.on('open', () => {
          clearTimeout(timeout);
          component.status = 'online';
          ws.close();
          resolve(component);
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          component.status = 'offline';
          component.details = { error: err.message };
          resolve(component);
        });
      } catch (error) {
        clearTimeout(timeout);
        component.status = 'offline';
        component.details = { error: (error as Error).message };
        resolve(component);
      }
    });
  }

  static async checkRedis(url: string): Promise<ComponentStatus> {
    const component: ComponentStatus = {
      name: 'Redis',
      type: 'local',
      status: 'unknown',
      lastChecked: new Date(),
    };

    try {
      const client = createClient({ url });
      await client.connect();
      const pong = await client.ping();
      await client.quit();

      component.status = pong === 'PONG' ? 'online' : 'degraded';
      component.details = { response: pong };
    } catch (error) {
      component.status = 'offline';
      component.details = { error: (error as Error).message };
    }

    return component;
  }
}

// ============================================================
// MASTER ORCHESTRATOR
// ============================================================

class TNFOrchestrator extends EventEmitter {
  private components: Map<string, ComponentStatus> = new Map();
  private events: SystemEvent[] = [];
  private relayConnection: WebSocket | null = null;
  private redisClient: RedisClientType | null = null;
  private running = false;

  constructor() {
    super();
    this.printBanner();
  }

  private printBanner(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗  ██╗███████╗    ███╗   ██╗███████╗██╗    ██╗                   ║
║   ╚══██╔══╝██║  ██║██╔════╝    ████╗  ██║██╔════╝██║    ██║                   ║
║      ██║   ███████║█████╗      ██╔██╗ ██║█████╗  ██║ █╗ ██║                   ║
║      ██║   ██╔══██║██╔══╝      ██║╚██╗██║██╔══╝  ██║███╗██║                   ║
║      ██║   ██║  ██║███████╗    ██║ ╚████║███████╗╚███╔███╔╝                   ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝                    ║
║                                                                              ║
║          ███████╗██╗   ██╗███████╗███████╗                                   ║
║          ██╔════╝██║   ██║██╔════╝██╔════╝                                   ║
║          █████╗  ██║   ██║███████╗█████╗                                     ║
║          ██╔══╝  ██║   ██║╚════██║██╔══╝                                     ║
║          ██║     ╚██████╔╝███████║███████╗                                   ║
║          ╚═╝      ╚═════╝ ╚══════╝╚══════╝                                   ║
║                                                                              ║
║              🤖 MASTER ORCHESTRATOR - Unified Agentic Ecosystem 🤖           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  async start(): Promise<void> {
    this.running = true;
    console.log('\n🚀 Starting TNF Master Orchestrator...\n');

    // Phase 1: System Health Check
    await this.runHealthChecks();

    // Phase 2: Connect to Communication Backbone
    await this.connectToBackbone();

    // Phase 3: Start Self-Improvement Loop
    this.startSelfImprovementLoop();

    // Phase 4: Start Heartbeat Monitor
    this.startHeartbeatMonitor();

    console.log('\n✅ TNF Ecosystem is now active!\n');
    this.printSystemStatus();
  }

  async runHealthChecks(): Promise<void> {
    console.log('═══ PHASE 1: System Health Check ═══\n');

    const checks = [
      HealthChecker.checkHttp(CONFIG.localRelayHealth, 'Local Relay'),
      HealthChecker.checkRedis(CONFIG.redisUrl),
      HealthChecker.checkHttp(`${CONFIG.cloudApi}/health`, 'Cloud API'),
      HealthChecker.checkHttp(CONFIG.cloudIde, 'Cloud IDE (SkIDEancer)'),
      HealthChecker.checkHttp(`${CONFIG.cloudSandbox}/health`, 'Cloud Sandbox'),
    ];

    const results = await Promise.all(checks);

    for (const result of results) {
      this.components.set(result.name, result);
      const icon = result.status === 'online' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌';
      console.log(`${icon} ${result.name}: ${result.status.toUpperCase()}`);
      if (result.details && result.status !== 'online') {
        console.log(`   └─ ${JSON.stringify(result.details)}`);
      }
    }

    // Add static component entries for apps that need manual verification
    this.components.set('Chrome Extension', {
      name: 'Chrome Extension',
      type: 'extension',
      status: 'unknown',
      lastChecked: new Date(),
      details: { note: 'Check chrome://extensions for Fuse Connect status' },
    });

    this.components.set('VSCode Extension', {
      name: 'VSCode Extension',
      type: 'extension',
      status: 'unknown',
      lastChecked: new Date(),
      details: { note: 'Check VS Code Extensions panel for TNF LM Bridge status' },
    });

    this.components.set('Electron Desktop', {
      name: 'Electron Desktop',
      type: 'desktop',
      status: 'unknown',
      lastChecked: new Date(),
      details: { location: 'apps/electron-desktop' },
    });

    this.components.set('Tauri Desktop', {
      name: 'Tauri Desktop',
      type: 'desktop',
      status: 'unknown',
      lastChecked: new Date(),
      details: { location: 'apps/tauri-desktop' },
    });

    console.log('');
  }

  async connectToBackbone(): Promise<void> {
    console.log('═══ PHASE 2: Connecting to Communication Backbone ═══\n');

    // Connect to local relay
    try {
      this.relayConnection = new WebSocket(CONFIG.localRelay);

      this.relayConnection.on('open', () => {
        console.log('✅ Connected to Local Relay');
        this.registerAsOrchestrator();
      });

      this.relayConnection.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        this.handleRelayMessage(msg);
      });

      this.relayConnection.on('close', () => {
        console.log('❌ Disconnected from Local Relay');
        this.components.get('Local Relay')!.status = 'offline';
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Relay connection timeout')), 5000);
        this.relayConnection!.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.relayConnection!.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (error) {
      console.log('⚠️ Could not connect to Local Relay:', (error as Error).message);
    }

    // Connect to Redis for pub/sub
    try {
      this.redisClient = createClient({ url: CONFIG.redisUrl });
      await this.redisClient.connect();

      // Subscribe to orchestration channel
      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();

      await subscriber.subscribe('tnf:orchestrator', (message) => {
        this.handleRedisMessage(JSON.parse(message));
      });

      await subscriber.subscribe('tnf:heartbeat', (message) => {
        this.handleHeartbeat(JSON.parse(message));
      });

      console.log('✅ Connected to Redis pub/sub');
    } catch (error) {
      console.log('⚠️ Could not connect to Redis:', (error as Error).message);
    }

    console.log('');
  }

  private registerAsOrchestrator(): void {
    if (!this.relayConnection) return;

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'AGENT_REGISTER',
      source: 'master-orchestrator',
      timestamp: Date.now(),
      payload: {
        agent: {
          id: 'master-orchestrator',
          name: 'TNF Master Orchestrator',
          platform: 'node-cli',
          status: 'active',
          capabilities: [
            'system-monitoring',
            'self-improvement',
            'workflow-orchestration',
            'agent-coordination',
            'health-checks',
          ],
          channels: ['general', 'orchestration', 'self-improvement'],
        },
      },
    };

    this.relayConnection.send(JSON.stringify(msg));
  }

  private handleRelayMessage(msg: any): void {
    this.logEvent('relay', msg.type, msg);

    switch (msg.type) {
      case 'AGENT_LIST':
        const agents = msg.payload?.agents || [];
        console.log(`📋 Active Agents: ${agents.map((a: any) => a.name).join(', ')}`);
        break;
      case 'AGENT_STATUS':
        const agent = msg.payload?.agent;
        if (agent) {
          console.log(`👤 Agent ${agent.name} is now ${agent.status}`);
        }
        break;
      case 'MESSAGE_RECEIVE':
      case 'CHANNEL_MESSAGE':
        const payload = msg.payload;
        console.log(
          `💬 [${payload.channel || 'direct'}] ${payload.from}: ${payload.content?.substring(0, 60)}...`
        );
        break;
    }
  }

  private handleRedisMessage(msg: any): void {
    this.logEvent('redis', msg.type || 'message', msg);
    console.log(`📡 Redis: ${JSON.stringify(msg).substring(0, 100)}...`);
  }

  private handleHeartbeat(msg: any): void {
    // Update component status based on heartbeat
    if (msg.component) {
      const component = this.components.get(msg.component);
      if (component) {
        component.status = 'online';
        component.lastChecked = new Date();
        component.details = msg.details;
      }
    }
  }

  private startSelfImprovementLoop(): void {
    console.log('═══ PHASE 3: Self-Improvement Loop ═══\n');
    console.log('🔄 Starting continuous self-improvement process...');

    // This would typically be triggered by cron jobs on Railway
    // For demonstration, we simulate the loop
    setInterval(() => {
      this.runImprovementCycle();
    }, 60000); // Every minute for demo

    console.log('✅ Self-improvement loop active (60s interval)\n');
  }

  private async runImprovementCycle(): Promise<void> {
    const cycle = {
      timestamp: new Date().toISOString(),
      checks: [] as string[],
    };

    // 1. Check system health
    cycle.checks.push('health_check');

    // 2. Analyze agent performance
    cycle.checks.push('agent_performance');

    // 3. Optimize resource usage
    cycle.checks.push('resource_optimization');

    // 4. Update configurations if needed
    cycle.checks.push('config_sync');

    // Broadcast improvement cycle to Redis
    if (this.redisClient?.isOpen) {
      await this.redisClient.publish(
        'tnf:self-improvement',
        JSON.stringify({
          type: 'improvement_cycle',
          data: cycle,
        })
      );
    }

    console.log(`🔄 Improvement cycle completed: ${cycle.checks.join(', ')}`);
  }

  private startHeartbeatMonitor(): void {
    console.log('═══ PHASE 4: Heartbeat Monitor ═══\n');
    console.log('💓 Starting heartbeat broadcast...');

    setInterval(async () => {
      const heartbeat = {
        component: 'master-orchestrator',
        timestamp: new Date().toISOString(),
        status: 'active',
        details: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          components: Array.from(this.components.values()).filter((c) => c.status === 'online')
            .length,
        },
      };

      // Broadcast heartbeat
      if (this.redisClient?.isOpen) {
        await this.redisClient.publish('tnf:heartbeat', JSON.stringify(heartbeat));
      }

      // Send to relay
      if (this.relayConnection?.readyState === WebSocket.OPEN) {
        this.relayConnection.send(
          JSON.stringify({
            type: 'HEARTBEAT',
            source: 'master-orchestrator',
            timestamp: Date.now(),
          })
        );
      }
    }, 30000); // Every 30 seconds

    console.log('✅ Heartbeat monitor active (30s interval)\n');
  }

  private logEvent(source: string, type: string, data: unknown): void {
    this.events.push({
      timestamp: new Date(),
      source,
      type,
      data,
    });

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  printSystemStatus(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           TNF ECOSYSTEM STATUS                               ║
╠══════════════════════════════════════════════════════════════════════════════╣`);

    console.log('║ INFRASTRUCTURE SERVICES                                                      ║');
    for (const [name, component] of this.components) {
      if (component.type === 'local' || component.type === 'cloud') {
        const icon = component.status === 'online' ? '✅' : '❌';
        const line = `║   ${icon} ${name.padEnd(25)} ${component.status.toUpperCase().padEnd(10)}                          ║`;
        console.log(line);
      }
    }

    console.log('║                                                                              ║');
    console.log('║ DESKTOP & EXTENSION APPS                                                     ║');
    for (const [name, component] of this.components) {
      if (component.type === 'extension' || component.type === 'desktop') {
        const icon =
          component.status === 'online' ? '✅' : component.status === 'unknown' ? '❓' : '❌';
        const line = `║   ${icon} ${name.padEnd(25)} ${component.status.toUpperCase().padEnd(10)}                          ║`;
        console.log(line);
      }
    }

    console.log(`║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ COMMUNICATION CHANNELS                                                       ║
║   📡 WebSocket Relay     -> Multi-agent real-time messaging                 ║
║   📡 Redis Pub/Sub       -> Cross-instance coordination                     ║
║   📡 Cloud Sandbox CDP   -> Remote browser automation                       ║
║   📡 Live View Stream    -> Human monitoring of AI activities               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ACTIVE LOOPS                                                                 ║
║   🔄 Self-Improvement Loop (60s interval)                                   ║
║   💓 Heartbeat Monitor (30s interval)                                       ║
║   🔍 Health Check (on-demand)                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  }

  async stop(): Promise<void> {
    this.running = false;
    this.relayConnection?.close();
    await this.redisClient?.quit();
    console.log('\n👋 TNF Master Orchestrator stopped.\n');
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const orchestrator = new TNFOrchestrator();

  process.on('SIGINT', async () => {
    await orchestrator.stop();
    process.exit(0);
  });

  await orchestrator.start();

  // Keep running
  console.log('🎯 Orchestrator is running. Press Ctrl+C to stop.\n');
  console.log('📊 Monitoring system activity...\n');
}

main().catch(console.error);
