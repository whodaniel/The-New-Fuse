import Redis from 'ioredis';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for agent messages as specified in the onboarding instructions
 */
interface AgentMessage {
  type: string;
  timestamp: string;
  metadata: {
    version: string;
    priority: 'low' | 'medium' | 'high';
    source: string;
  };
  details?: Record<string, any>;
}

/**
 * Trae Agent implementation for The New Fuse system
 * Handles system verification, registration, and communication
 */
class TraeAgent {
  private readonly logger = new Logger(TraeAgent.name);
  private readonly redis: Redis;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;
  private isRegistered = false;
  private isConnected = false;
  private readonly apiEndpoint = 'http://localhost:3001/api/v1/agents/register';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
  }

  /**
   * Initialize the Trae Agent
   * 1. Verify system requirements
   * 2. Register with the API
   * 3. Set up communication channels
   * 4. Send initial handshake
   */
  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing Trae Agent...');
      
      // Step 1: System Verification
      await this.verifySystemRequirements();
      
      // Step 2: Agent Registration
      await this.registerAgent();
      
      // Step 3: Communication Setup
      await this.setupCommunication();
      
      // Step 4: Send initial handshake
      await this.sendInitialHandshake();
      
      this.logger.log('Trae Agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Trae Agent:', error);
      throw error;
    }
  }

  /**
   * Verify Redis and environment requirements
   */
  private async verifySystemRequirements(): Promise<void> {
    try {
      this.logger.log('Verifying system requirements...');
      
      // Check Redis connection
      const pingResult = await this.redis.ping();
      if (pingResult !== 'PONG') {
        throw new Error('Redis ping failed');
      }
      
      // Check Redis info
      const info = await this.redis.info();
      if (!info.includes('tcp_port:6379')) {
        this.logger.warn('Redis may not be running on default port 6379');
      }
      
      // Verify environment
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.logger.log(`Using Redis URL: ${redisUrl}`);
      
      this.logger.log('System requirements verified');
    } catch (error) {
      this.logger.error('System verification failed:', error);
      throw error;
    }
  }

  /**
   * Register the agent with the API
   */
  private async registerAgent(): Promise<void> {
    try {
      this.logger.log('Registering Trae Agent...');
      
      const registrationPayload = {
        type: 'INTRODUCTION',
        source: 'trae',
        target: 'new_fuse_core',
        content: {
          action: 'initialize',
          capabilities: [
            'code_analysis',
            'task_coordination',
            'system_integration',
            'code_generation'
          ],
          metadata: {
            version: '1.0',
            priority: 'high',
            agent_type: 'implementation_specialist'
          }
        },
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(this.apiEndpoint, registrationPayload);
      
      if (response.status === 200 || response.status === 201) {
        this.logger.log('Registration successful:', response.data);
        this.isRegistered = true;
      } else {
        throw new Error(`Registration failed with status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Set up Redis communication channels
   */
  private async setupCommunication(): Promise<void> {
    try {
      this.logger.log('Setting up communication channels...');
      
      // Subscribe to required channels
      await this.subClient.subscribe('agent:trae', 'agent:broadcast', 'agent:augment');
      
      // Set up message handler
      this.subClient.on('message', this.handleMessage.bind(this));
      
      this.isConnected = true;
      this.logger.log('Communication channels established');
    } catch (error) {
      this.logger.error('Failed to set up communication:', error);
      throw error;
    }
  }

  /**
   * Send initial handshake message to agent:augment channel
   */
  private async sendInitialHandshake(): Promise<void> {
    try {
      this.logger.log('Sending initial handshake...');
      
      const handshakeMessage: AgentMessage = {
        type: 'system',
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.1.0',
          priority: 'high',
          source: 'Trae'
        },
        details: {
          action: 'initialize',
          capabilities: ['code_analysis', 'task_coordination']
        }
      };
      
      await this.pubClient.publish('agent:augment', JSON.stringify(handshakeMessage));
      this.logger.log('Initial handshake sent');
    } catch (error) {
      this.logger.error('Failed to send handshake:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from subscribed channels
   */
  private handleMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message) as AgentMessage;
      this.logger.log(`Received message on ${channel}:`);
      this.logger.log(`Type: ${data.type}`);
      this.logger.log(`Source: ${data.metadata.source}`);
      this.logger.log(`Priority: ${data.metadata.priority}`);
      
      switch (data.type) {
        case 'acknowledgment':
          this.logger.log('Received acknowledgment');
          break;
        case 'task_assignment':
          this.handleTaskAssignment(data);
          break;
        case 'system':
          this.handleSystemMessage(data);
          break;
        default:
          this.logger.log(`Unhandled message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
    }
  }

  /**
   * Handle task assignment messages
   */
  private handleTaskAssignment(data: AgentMessage): void {
    this.logger.log('Received task assignment:');
    this.logger.log(JSON.stringify(data.details, null, 2));
    // Implementation for task handling would go here
  }

  /**
   * Handle system messages
   */
  private handleSystemMessage(data: AgentMessage): void {
    this.logger.log('Received system message:');
    this.logger.log(JSON.stringify(data.details, null, 2));
    // Implementation for system message handling would go here
  }

  /**
   * Send a message to a specific channel
   */
  async sendMessage(channel: string, message: AgentMessage): Promise<void> {
    try {
      await this.pubClient.publish(channel, JSON.stringify(message));
      this.logger.log(`Message sent to ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      await this.pubClient.quit();
      await this.subClient.quit();
      this.logger.log('Cleaned up Redis connections');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { registered: boolean; connected: boolean } {
    return {
      registered: this.isRegistered,
      connected: this.isConnected
    };
  }
}

async function main(): any {
  const traeAgent = new TraeAgent();
  try {
    await traeAgent.initialize();

    // Keep the process running to monitor channels
    process.on('SIGINT', async () => {
      
      await traeAgent.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to initialize Trae Agent:', error);
  }
}

// Run the agent
if (require.main === module) {
  main().catch(console.error);
}

export { TraeAgent, AgentMessage };