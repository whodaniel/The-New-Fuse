#!/usr/bin/env ts-node
/**
 * Example Node.js/TypeScript Agent - AG-UI Protocol Demo
 *
 * This agent connects to The New Fuse AG-UI server and generates
 * self-contained HTML visualizations in real-time.
 *
 * Requirements:
 *   npm install ws @types/ws
 *
 * Usage:
 *   ts-node nodejs-agent-example.ts
 *   # or
 *   npx tsx nodejs-agent-example.ts
 */

import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

interface AGUIMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface VisualizationResult {
  success: boolean;
  filePath: string;
  html: string;
}

interface SystemHealth {
  status: string;
  activeSessions: number;
  uptime: number;
}

class AGUIAgent {
  private agentId: string;
  private serverUrl: string;
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor(agentId: string, serverUrl: string = 'ws://localhost:8765') {
    this.agentId = agentId;
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl, {
        headers: {
          'X-Agent-Id': this.agentId,
        },
      });

      this.ws.on('open', () => {
        console.log(`✅ Agent '${this.agentId}' connected to AG-UI server`);
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        const message: AGUIMessage = JSON.parse(data.toString());
        this.handleMessage(message);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`👋 Agent '${this.agentId}' disconnected`);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: AGUIMessage): void {
    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      if (message.type === 'error') {
        pending.reject(new Error(message.error?.message || 'Unknown error'));
      } else {
        pending.resolve(message.result);
      }
      this.pendingRequests.delete(message.id);
    }
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    if (!this.ws) {
      throw new Error('Not connected to AG-UI server');
    }

    const id = uuidv4();
    const request: AGUIMessage = {
      id,
      type: 'request',
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async generateAgentFlowVisualization(): Promise<VisualizationResult> {
    const data = {
      nodes: [
        { id: 'agent1', name: 'Data Collector', type: 'worker', status: 'active' },
        { id: 'agent2', name: 'Analyzer', type: 'processor', status: 'active' },
        { id: 'agent3', name: 'Reporter', type: 'output', status: 'idle' },
        { id: 'orchestrator', name: 'TNF Orchestrator', type: 'master', status: 'active' },
      ],
      edges: [
        { source: 'orchestrator', target: 'agent1', type: 'command', weight: 3 },
        { source: 'agent1', target: 'agent2', type: 'data', weight: 5 },
        { source: 'agent2', target: 'agent3', type: 'data', weight: 4 },
        { source: 'agent3', target: 'orchestrator', type: 'status', weight: 2 },
      ],
    };

    const result = await this.sendRequest('visualization.generate', {
      type: 'agent-flow',
      data,
      title: `Agent Communication Flow - ${new Date().toLocaleString()}`,
      aiInsights: `
        <div style="padding: 20px; background: #f0f7ff; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1a73e8;">🤖 AI Analysis</h3>
          <p><strong>Current System State:</strong> All agents operational</p>
          <ul>
            <li><strong>Data Collector:</strong> Processing 150 requests/min</li>
            <li><strong>Analyzer:</strong> 95% accuracy, low latency</li>
            <li><strong>Reporter:</strong> Idle, awaiting processed data</li>
            <li><strong>Orchestrator:</strong> Coordinating 4 active workflows</li>
          </ul>
          <p><strong>Recommendation:</strong> System is healthy. Consider scaling Reporter
          to handle upcoming data burst from Analyzer.</p>
        </div>
      `,
    });

    return result;
  }

  async generateWorkflowDependencyGraph(): Promise<VisualizationResult> {
    const data = {
      nodes: [
        { id: 'w1', name: 'User Onboarding', type: 'workflow', status: 'active', duration: 45 },
        { id: 'w2', name: 'Email Verification', type: 'task', status: 'completed', duration: 12 },
        { id: 'w3', name: 'Profile Setup', type: 'task', status: 'active', duration: 30 },
        { id: 'w4', name: 'Welcome Email', type: 'task', status: 'pending', duration: 5 },
        { id: 'w5', name: 'Tutorial', type: 'task', status: 'pending', duration: 60 },
      ],
      edges: [
        { source: 'w1', target: 'w2', type: 'depends', critical: true },
        { source: 'w2', target: 'w3', type: 'depends', critical: true },
        { source: 'w3', target: 'w4', type: 'depends', critical: false },
        { source: 'w3', target: 'w5', type: 'depends', critical: false },
      ],
    };

    const result = await this.sendRequest('visualization.generate', {
      type: 'workflow-deps',
      data,
      title: `Workflow Dependencies - ${new Date().toLocaleString()}`,
      aiInsights: `
        <div style="padding: 20px; background: #e8f5e9; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2e7d32;">⚡ Workflow Analysis</h3>
          <p><strong>Critical Path:</strong> User Onboarding → Email Verification → Profile Setup</p>
          <p><strong>Total Duration:</strong> 87 minutes (45 + 12 + 30)</p>
          <ul>
            <li><strong>Completed:</strong> Email Verification (12 min)</li>
            <li><strong>In Progress:</strong> Profile Setup (30 min remaining)</li>
            <li><strong>Pending:</strong> Welcome Email (5 min), Tutorial (60 min)</li>
          </ul>
          <p><strong>Recommendation:</strong> Profile Setup is on critical path. Monitor closely
          to prevent delays in downstream tasks.</p>
        </div>
      `,
    });

    return result;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return await this.sendRequest('system.health', {});
  }

  async setSessionState(key: string, value: any): Promise<void> {
    await this.sendRequest('session.setState', { key, value });
  }

  async getSessionState(key: string): Promise<any> {
    const result = await this.sendRequest('session.getState', { key });
    return result.value;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 AG-UI Protocol Demo - Node.js Agent Example');
  console.log('='.repeat(70));
  console.log();

  const agent = new AGUIAgent('nodejs-demo-agent');

  try {
    // Connect to AG-UI server
    await agent.connect();
    console.log();

    // Check system health
    console.log('📊 Checking system health...');
    const health = await agent.getSystemHealth();
    console.log(`   Status: ${health.status}`);
    console.log(`   Active Sessions: ${health.activeSessions}`);
    console.log();

    // Set session state
    console.log('💾 Setting session state...');
    await agent.setSessionState('demo_start_time', new Date().toISOString());
    await agent.setSessionState('visualizations_generated', 0);
    console.log('   ✅ Session state initialized');
    console.log();

    // Generate agent flow visualization
    console.log('🎨 Generating Agent Communication Flow visualization...');
    const result1 = await agent.generateAgentFlowVisualization();
    if (result1.success) {
      console.log(`   ✅ Visualization created: ${result1.filePath}`);
      console.log(`   📄 Open in browser: file://${result1.filePath}`);
    }
    console.log();

    // Generate workflow dependency graph
    console.log('🎨 Generating Workflow Dependency Graph visualization...');
    const result2 = await agent.generateWorkflowDependencyGraph();
    if (result2.success) {
      console.log(`   ✅ Visualization created: ${result2.filePath}`);
      console.log(`   📄 Open in browser: file://${result2.filePath}`);
    }
    console.log();

    // Update session state
    await agent.setSessionState('visualizations_generated', 2);
    const vizCount = await agent.getSessionState('visualizations_generated');
    console.log(`📈 Session Update: Generated ${vizCount} visualizations`);
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log('✅ Demo Complete!');
    console.log('='.repeat(70));
    console.log();
    console.log('What happened:');
    console.log('  1. ✅ Connected to AG-UI server via WebSocket');
    console.log('  2. ✅ Checked system health status');
    console.log('  3. ✅ Managed session state (set/get)');
    console.log('  4. ✅ Generated 2 self-contained HTML visualizations');
    console.log('  5. ✅ Each visualization is permanent, shareable, offline-ready');
    console.log();
    console.log('Next Steps:');
    console.log('  • Open the generated HTML files in your browser');
    console.log('  • Customize the data for your use case');
    console.log('  • Integrate into your agent workflows');
    console.log('  • Share visualizations with your team');
    console.log();
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ ERROR: Could not connect to AG-UI server');
      console.log();
      console.log('Please ensure:');
      console.log('  1. The New Fuse backend is running');
      console.log('  2. AG-UI server is started on port 8765');
      console.log('  3. Run: pnpm run dev (from The New Fuse root)');
      console.log();
    } else {
      console.error('❌ ERROR:', error.message);
      console.error(error.stack);
    }
  } finally {
    await agent.disconnect();
  }
}

// Run the demo
main().catch(console.error);
