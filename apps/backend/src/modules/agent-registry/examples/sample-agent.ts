/**
 * Sample Self-Registering Agent
 *
 * This is a complete example of an agent that registers itself with
 * The New Fuse platform and completes the onboarding process.
 */

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';

interface AgentConfig {
  name: string;
  version: string;
  author: string;
  description: string;
  apiBaseUrl: string;
  capabilities: Array<{
    name: string;
    type: 'core' | 'extended' | 'custom';
    version?: string;
    description?: string;
    parameters?: Record<string, any>;
  }>;
}

interface RegistrationResponse {
  registrationId: string;
  agentId: string;
  authToken: string;
  verificationStatus: string;
  onboardingStatus: string;
  welcomeMessage: string;
  nextSteps: string[];
  onboardingUrl: string;
  createdAt: string;
}

class SelfRegisteringAgent {
  private config: AgentConfig;
  private apiClient: AxiosInstance;
  private authToken?: string;
  private registrationId?: string;
  private agentId?: string;
  private ws?: WebSocket;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: AgentConfig) {
    this.config = config;
    this.apiClient = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize and register the agent
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.config.name}...`);

    try {
      // Step 1: Register with the platform
      await this.register();

      // Step 2: Start onboarding
      await this.startOnboarding();

      // Step 3: Test capabilities
      await this.testCapabilities();

      // Step 4: Complete orientation
      await this.completeOrientation();

      // Step 5: Connect to agent gateway
      await this.connectToGateway();

      // Step 6: Start heartbeat
      this.startHeartbeat();

      console.log('✅ Agent initialization complete!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register the agent with the platform
   */
  private async register(): Promise<void> {
    console.log('📝 Registering agent...');

    const registrationData = {
      name: this.config.name,
      version: this.config.version,
      author: this.config.author,
      description: this.config.description,
      capabilities: this.config.capabilities,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version,
      },
      heartbeatInterval: 60000, // 60 seconds
    };

    const response = await this.apiClient.post<RegistrationResponse>(
      '/api/agent-registry/register',
      registrationData,
    );

    this.authToken = response.data.authToken;
    this.registrationId = response.data.registrationId;
    this.agentId = response.data.agentId;

    // Update API client with auth token
    this.apiClient.defaults.headers['X-Agent-Token'] = this.authToken;

    console.log(`✅ Registered successfully!`);
    console.log(`   Registration ID: ${this.registrationId}`);
    console.log(`   Agent ID: ${this.agentId}`);
    console.log(`\n${response.data.welcomeMessage}\n`);
    console.log('Next steps:');
    response.data.nextSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  }

  /**
   * Start the onboarding process
   */
  private async startOnboarding(): Promise<void> {
    console.log('\n🎯 Starting onboarding...');

    const response = await this.apiClient.post(
      `/api/agent-registry/onboarding/${this.registrationId}/start`,
    );

    console.log(`✅ Onboarding started: ${response.data.currentStep}`);
    console.log(`   Progress: ${response.data.progress}%`);
  }

  /**
   * Test agent capabilities
   */
  private async testCapabilities(): Promise<void> {
    console.log('\n🧪 Testing capabilities...');

    const response = await this.apiClient.post(
      `/api/agent-registry/onboarding/${this.registrationId}/test-capabilities`,
    );

    const results = response.data;
    console.log(`✅ Capability tests completed:`);
    results.forEach((result: any) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.capabilityName}: ${result.details}`);
      if (result.score) {
        console.log(`      Score: ${(result.score * 100).toFixed(1)}%`);
      }
    });
  }

  /**
   * Complete the orientation process
   */
  private async completeOrientation(): Promise<void> {
    console.log('\n📚 Completing orientation...');

    // Get orientation steps
    const stepsResponse = await this.apiClient.get(
      '/api/agent-registry/orientation/steps',
    );
    const steps = stepsResponse.data;

    console.log(`   Total orientation steps: ${steps.length}`);

    // Complete each step
    for (const step of steps) {
      console.log(`   📖 Completing step: ${step.name}...`);

      await this.apiClient.post(
        `/api/agent-registry/onboarding/${this.registrationId}/complete-step`,
        {
          stepId: step.id,
          data: {
            completed: true,
            timestamp: new Date().toISOString(),
          },
        },
      );

      // Simulate reading the content
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Mark orientation as complete
    await this.apiClient.post(
      `/api/agent-registry/onboarding/${this.registrationId}/complete-step`,
      {
        stepId: 'orientation_completed',
      },
    );

    console.log('✅ Orientation completed!');
  }

  /**
   * Connect to the agent communication gateway
   */
  private async connectToGateway(): Promise<void> {
    console.log('\n🔌 Connecting to agent gateway...');

    const wsUrl = this.config.apiBaseUrl.replace('http', 'ws') + '/agent-gateway';
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws!.on('open', () => {
        // Authenticate
        this.ws!.send(
          JSON.stringify({
            type: 'authenticate',
            token: this.authToken,
          }),
        );

        console.log('✅ Connected to agent gateway!');
        resolve();
      });

      this.ws!.on('message', (data) => {
        this.handleGatewayMessage(JSON.parse(data.toString()));
      });

      this.ws!.on('error', (error) => {
        console.error('❌ Gateway connection error:', error);
        reject(error);
      });

      this.ws!.on('close', () => {
        console.log('🔌 Gateway connection closed');
        // Attempt reconnection
        setTimeout(() => this.connectToGateway(), 5000);
      });
    });
  }

  /**
   * Handle messages from the gateway
   */
  private handleGatewayMessage(message: any): void {
    console.log('📨 Received message:', message.type);

    switch (message.type) {
      case 'task.assigned':
        this.handleTaskAssignment(message.payload);
        break;
      case 'message':
        this.handleAgentMessage(message.payload);
        break;
      case 'broadcast':
        this.handleBroadcast(message.payload);
        break;
      default:
        console.log('   Unknown message type:', message.type);
    }
  }

  /**
   * Handle task assignment
   */
  private async handleTaskAssignment(task: any): Promise<void> {
    console.log(`📋 Task assigned: ${task.type}`);

    // Process the task (implement your task logic here)
    await this.processTask(task);

    // Report completion
    console.log('✅ Task completed!');
  }

  /**
   * Process a task
   */
  private async processTask(task: any): Promise<void> {
    // Simulate task processing
    console.log(`   Processing task: ${task.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Record metrics
    await this.recordMetric({
      type: 'task_completion',
      value: 1,
      unit: 'count',
      tags: {
        taskType: task.type,
        taskId: task.id,
      },
    });
  }

  /**
   * Handle message from another agent
   */
  private handleAgentMessage(message: any): void {
    console.log(`💬 Message from agent ${message.from}:`, message.content);
  }

  /**
   * Handle broadcast message
   */
  private handleBroadcast(message: any): void {
    console.log(`📢 Broadcast on ${message.channel}:`, message.content);
  }

  /**
   * Start sending heartbeats
   */
  private startHeartbeat(): void {
    console.log('\n💓 Starting heartbeat...');

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.apiClient.post('/api/agent-registry/heartbeat');
        console.log('💓 Heartbeat sent');
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, 60000); // Every 60 seconds

    console.log('✅ Heartbeat started (60s interval)');
  }

  /**
   * Record a metric
   */
  private async recordMetric(metric: {
    type: string;
    value: number;
    unit?: string;
    tags?: any;
  }): Promise<void> {
    try {
      await this.apiClient.post('/api/agent-registry/metrics', metric);
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down agent...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }

    console.log('✅ Agent shutdown complete');
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function main() {
  const agent = new SelfRegisteringAgent({
    name: 'CodeAssistantAgent',
    version: '1.0.0',
    author: 'The New Fuse Team',
    description: 'An AI-powered code assistant that helps developers write better code',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    capabilities: [
      {
        name: 'code_generation',
        type: 'core',
        version: '1.0.0',
        description: 'Generate code snippets and functions',
        parameters: {
          languages: ['javascript', 'typescript', 'python'],
          frameworks: ['react', 'nestjs', 'express'],
        },
      },
      {
        name: 'code_review',
        type: 'core',
        version: '1.0.0',
        description: 'Review code for best practices and potential issues',
      },
      {
        name: 'documentation',
        type: 'extended',
        version: '1.0.0',
        description: 'Generate documentation from code',
      },
    ],
  });

  try {
    await agent.initialize();

    // Keep the agent running
    process.on('SIGINT', async () => {
      await agent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { SelfRegisteringAgent, AgentConfig };
