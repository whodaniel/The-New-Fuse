/**
 * Data Analysis Agent Example
 *
 * Demonstrates a different type of agent with data processing capabilities
 */

import axios from 'axios';
import os from 'os';
import {
  AgentRegistration,
  AgentHeartbeat,
  AgentStatus,
  AgentHealthMetrics,
} from '../../packages/api/src/types/agent-discovery.types';

class DataAnalysisAgent {
  private agentId: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private startTime: number;
  private metrics: AgentHealthMetrics;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:3000/api') {
    this.agentId = 'data-analyst-01';
    this.startTime = Date.now();
    this.apiBaseUrl = apiBaseUrl;
    this.metrics = {
      isHealthy: true,
      uptime: 0,
      successRate: 0.92,
      avgResponseTime: 3500,
      cpuUsage: 0,
      memoryUsage: 0,
      activeTasks: 0,
      totalTasks: 0,
      failedTasks: 0,
    };
  }

  async register(): Promise<void> {
    const registration: AgentRegistration = {
      agentId: this.agentId,
      name: 'Data Analysis Agent',
      description: 'Advanced data analysis, visualization, and statistical modeling',
      type: 'data-processing',
      groups: ['analytics', 'data-science', 'reporting'],
      version: '2.0.1',
      capabilities: [
        {
          name: 'statistical-analysis',
          version: '2.0.0',
          description: 'Statistical analysis including regression, correlation, and hypothesis testing',
          languages: ['python', 'r'],
          frameworks: ['pandas', 'numpy', 'scipy', 'statsmodels'],
          confidence: 0.93,
          pricing: {
            perInvocation: 0.05,
            perMinute: 0.02,
            currency: 'USD',
            freeTier: {
              invocations: 100,
              minutes: 60,
            },
          },
        },
        {
          name: 'data-visualization',
          version: '1.5.0',
          description: 'Create interactive charts, graphs, and dashboards',
          frameworks: ['matplotlib', 'plotly', 'seaborn', 'd3'],
          confidence: 0.89,
          pricing: {
            perInvocation: 0.03,
            currency: 'USD',
            freeTier: {
              invocations: 50,
            },
          },
        },
        {
          name: 'data-cleaning',
          version: '1.8.0',
          description: 'Data cleaning, transformation, and preparation for analysis',
          languages: ['python'],
          frameworks: ['pandas', 'dask'],
          confidence: 0.94,
          pricing: {
            perInvocation: 0.02,
            currency: 'USD',
          },
        },
        {
          name: 'machine-learning',
          version: '1.3.0',
          description: 'Train and deploy machine learning models for prediction and classification',
          languages: ['python'],
          frameworks: ['scikit-learn', 'tensorflow', 'pytorch'],
          confidence: 0.85,
          pricing: {
            perInvocation: 0.15,
            perMinute: 0.05,
            currency: 'USD',
          },
          dependencies: [
            {
              capability: 'data-cleaning',
              minVersion: '1.5.0',
              optional: false,
            },
            {
              capability: 'statistical-analysis',
              minVersion: '1.8.0',
              optional: true,
            },
          ],
        },
        {
          name: 'report-generation',
          version: '1.2.0',
          description: 'Generate comprehensive analysis reports in various formats',
          confidence: 0.88,
          pricing: {
            perInvocation: 0.04,
            currency: 'USD',
          },
          dependencies: [
            {
              capability: 'data-visualization',
              minVersion: '1.0.0',
              optional: false,
            },
          ],
        },
      ],
    };

    try {
      await axios.post(`${this.apiBaseUrl}/agents/discovery/register`, registration);
      console.log(`Agent ${this.agentId} registered successfully`);
      this.startHeartbeat();
    } catch (error) {
      console.error('Failed to register agent:', error);
      throw error;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, 30000);

    this.sendHeartbeat();
  }

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
      console.log(`Heartbeat sent - Active tasks: ${this.metrics.activeTasks}, Success rate: ${(this.metrics.successRate * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  private updateMetrics(): void {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + (1 - idle / total) * 100;
    }, 0) / cpus.length;

    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    this.metrics = {
      ...this.metrics,
      uptime,
      cpuUsage: Number(cpuUsage.toFixed(2)),
      memoryUsage: Number(memoryUsage.toFixed(2)),
    };
  }

  private getStatus(): AgentStatus {
    if (this.metrics.activeTasks > 3) {
      return AgentStatus.BUSY;
    } else if (this.metrics.activeTasks > 0) {
      return AgentStatus.ONLINE;
    } else {
      return AgentStatus.IDLE;
    }
  }

  async performAnalysis(datasetName: string, analysisType: string): Promise<void> {
    this.metrics.activeTasks++;

    try {
      console.log(`Performing ${analysisType} on ${datasetName}...`);

      // Simulate work (data analysis takes longer)
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));

      this.metrics.totalTasks++;
      this.metrics.activeTasks--;

      const success = Math.random() > 0.08; // 92% success rate
      if (!success) {
        this.metrics.failedTasks++;
      }
      this.metrics.successRate = (this.metrics.totalTasks - this.metrics.failedTasks) / this.metrics.totalTasks;

      console.log(`Analysis completed. Total tasks: ${this.metrics.totalTasks}`);
    } catch (error) {
      this.metrics.activeTasks--;
      this.metrics.failedTasks++;
      console.error('Analysis failed:', error);
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down agent...');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

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

async function main() {
  const agent = new DataAnalysisAgent();

  try {
    await agent.register();

    console.log('\nSimulating data analysis tasks...\n');
    const tasks = [
      { dataset: 'sales_data.csv', type: 'statistical-analysis' },
      { dataset: 'customer_metrics.json', type: 'data-visualization' },
      { dataset: 'raw_logs.txt', type: 'data-cleaning' },
    ];

    for (const task of tasks) {
      await agent.performAnalysis(task.dataset, task.type);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.log('\nAgent running... Press Ctrl+C to stop\n');

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

export default DataAnalysisAgent;
