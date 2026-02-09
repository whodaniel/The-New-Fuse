/**
 * Code Review Agent Example
 *
 * Demonstrates agent registration with the discovery system
 * and automatic heartbeat management.
 */

import axios from 'axios';
import os from 'os';
import {
  AgentRegistration,
  AgentHeartbeat,
  AgentStatus,
  AgentHealthMetrics,
} from '../../packages/api/src/types/agent-discovery.types';

class CodeReviewAgent {
  private agentId: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private startTime: number;
  private metrics: AgentHealthMetrics;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:3000/api') {
    this.agentId = 'code-reviewer-01';
    this.startTime = Date.now();
    this.apiBaseUrl = apiBaseUrl;
    this.metrics = {
      isHealthy: true,
      uptime: 0,
      successRate: 0.95,
      avgResponseTime: 1200,
      cpuUsage: 0,
      memoryUsage: 0,
      activeTasks: 0,
      totalTasks: 0,
      failedTasks: 0,
    };
  }

  /**
   * Register agent with discovery system
   */
  async register(): Promise<void> {
    const registration: AgentRegistration = {
      agentId: this.agentId,
      name: 'Code Review Agent',
      description: 'Expert code reviewer supporting multiple languages with security scanning',
      type: 'code-analysis',
      groups: ['code-quality', 'security'],
      version: '1.2.0',
      capabilities: [
        {
          name: 'code-review',
          version: '1.2.0',
          description: 'Comprehensive code review with style, complexity, and best practice analysis',
          languages: ['python', 'typescript', 'javascript', 'go', 'rust'],
          confidence: 0.95,
          pricing: {
            perInvocation: 0.01,
            currency: 'USD',
          },
        },
        {
          name: 'security-scan',
          version: '1.1.0',
          description: 'Security vulnerability scanning and OWASP compliance checking',
          frameworks: ['nest', 'fastapi', 'express', 'django'],
          confidence: 0.88,
          pricing: {
            perInvocation: 0.015,
            currency: 'USD',
          },
          dependencies: [
            {
              capability: 'code-review',
              minVersion: '1.0.0',
              optional: false,
            },
          ],
        },
        {
          name: 'refactoring-suggestions',
          version: '1.0.0',
          description: 'Automated refactoring suggestions for improving code quality',
          languages: ['python', 'typescript', 'javascript'],
          confidence: 0.82,
          pricing: {
            perInvocation: 0.012,
            currency: 'USD',
          },
        },
      ],
    };

    try {
      await axios.post(`${this.apiBaseUrl}/agents/discovery/register`, registration);
      console.log(`Agent ${this.agentId} registered successfully`);

      // Start heartbeat
      this.startHeartbeat();
    } catch (error) {
      console.error('Failed to register agent:', error);
      throw error;
    }
  }

  /**
   * Start sending heartbeats
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, 30000); // Every 30 seconds

    // Send initial heartbeat immediately
    this.sendHeartbeat();
  }

  /**
   * Send heartbeat with current metrics
   */
  private async sendHeartbeat(): Promise<void> {
    this.updateMetrics();

    const heartbeat: AgentHeartbeat = {
      agentId: this.agentId,
      timestamp: new Date(),
      status: this.getStatus(),
      metrics: this.metrics,
    };

    try {
      await axios.post(`${this.apiBaseUrl}/agents/discovery/heartbeat`, heartbeat);
      console.log(`Heartbeat sent - Status: ${heartbeat.status}, Load: ${(this.calculateLoad() * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  /**
   * Update metrics from system
   */
  private updateMetrics(): void {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // Calculate CPU usage (simplified)
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + (1 - idle / total) * 100;
    }, 0) / cpus.length;

    // Calculate memory usage
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Calculate uptime
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    this.metrics = {
      ...this.metrics,
      uptime,
      cpuUsage: Number(cpuUsage.toFixed(2)),
      memoryUsage: Number(memoryUsage.toFixed(2)),
    };
  }

  /**
   * Get current agent status
   */
  private getStatus(): AgentStatus {
    if (this.metrics.activeTasks > 5) {
      return AgentStatus.BUSY;
    } else if (this.metrics.activeTasks > 0) {
      return AgentStatus.ONLINE;
    } else {
      return AgentStatus.IDLE;
    }
  }

  /**
   * Calculate current load
   */
  private calculateLoad(): number {
    const cpuWeight = 0.4;
    const memoryWeight = 0.3;
    const taskWeight = 0.3;

    const cpuLoad = this.metrics.cpuUsage / 100;
    const memoryLoad = this.metrics.memoryUsage / 100;
    const taskLoad = Math.min(this.metrics.activeTasks / 10, 1);

    return cpuWeight * cpuLoad + memoryWeight * memoryLoad + taskWeight * taskLoad;
  }

  /**
   * Simulate performing a code review task
   */
  async performCodeReview(code: string, language: string): Promise<void> {
    this.metrics.activeTasks++;

    try {
      console.log(`Reviewing ${language} code...`);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Update metrics
      this.metrics.totalTasks++;
      this.metrics.activeTasks--;

      // Update success rate
      const success = Math.random() > 0.05; // 95% success rate
      if (!success) {
        this.metrics.failedTasks++;
      }
      this.metrics.successRate = (this.metrics.totalTasks - this.metrics.failedTasks) / this.metrics.totalTasks;

      console.log(`Code review completed. Total tasks: ${this.metrics.totalTasks}`);
    } catch (error) {
      this.metrics.activeTasks--;
      this.metrics.failedTasks++;
      console.error('Code review failed:', error);
    }
  }

  /**
   * Gracefully shutdown and deregister
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down agent...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Deregister
    try {
      await axios.post(`${this.apiBaseUrl}/agents/discovery/deregister`, {
        agentId: this.agentId,
      });
      console.log('Agent deregistered successfully');
    } catch (error) {
      console.error('Failed to deregister agent:', error);
    }
  }
}

// Example usage
async function main() {
  const agent = new CodeReviewAgent();

  try {
    // Register agent
    await agent.register();

    // Simulate some work
    console.log('\nSimulating code reviews...\n');
    for (let i = 0; i < 5; i++) {
      await agent.performCodeReview('console.log("Hello, World!");', 'typescript');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Keep alive for demonstration
    console.log('\nAgent running... Press Ctrl+C to stop\n');

    // Graceful shutdown on SIGINT
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT signal');
      await agent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Agent error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default CodeReviewAgent;
