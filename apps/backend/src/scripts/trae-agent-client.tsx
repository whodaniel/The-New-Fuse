import Redis from 'ioredis';
import { TraeMonitor } from '../services/agent/trae-monitor.js';
import { Logger } from '@nestjs/common';

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

class TraeAgentClient {
  private readonly logger = new Logger(TraeAgentClient.name);
  private readonly redis: Redis;
  private readonly subscriber: Redis;
  private readonly monitor: TraeMonitor;
  private isConnected = false;
  private readonly channels = {
    primary: 'agent:trae',
    broadcast: 'agent:broadcast',
    augment: 'agent:augment',
    heartbeat: 'agent:heartbeat'
  };

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.monitor = new TraeMonitor();

    this.setupEventHandlers();
    this.initialize();
  }

  private setupEventHandlers(): void {
    this.subscriber.on('message', this.handleMessage.bind(this));
    this.subscriber.on('error', this.handleError.bind(this));
    this.redis.on('error', this.handleError.bind(this));
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize monitoring
      await this.monitor.initialize();
      
      // Subscribe to channels
      await this.subscriber.subscribe(
        this.channels.primary, 
        this.channels.broadcast, 
        this.channels.augment,
        this.channels.heartbeat
      );
      
      this.isConnected = true;
      this.logger.log('Trae Agent initialized and connected to Redis channels');
      
      // Start heartbeat
      await this.monitor.startHeartbeat('trae');
      
      // Enable metrics collection
      this.monitor.enableMetrics({
        collectInterval: 30000,  // Collect metrics every 30 seconds
        reportInterval: 300000   // Report metrics every 5 minutes
      });
      
      // Setup alert handlers
      this.monitor.onAlert((alert) => {
        this.logger.warn(`Received alert: ${JSON.stringify(alert)}`);
      });
      
      // Send initial handshake
      await this.sendInitialHandshake();
    } catch (error) {
      this.logger.error('Failed to initialize Trae Agent:', error);
      throw error;
    }
  }

  private async sendInitialHandshake(): Promise<void> {
    const initMessage: AgentMessage = {
      type: 'system',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.1.0',
        priority: 'high',
        source: 'trae'
      },
      details: {
        action: 'acknowledge',
        capabilities: ['code_analysis', 'task_coordination', 'system_integration', 'pair_programming'],
        monitoring: {
          status: 'active',
          heartbeat: true,
          metrics: true
        }
      }
    };

    await this.publishMessage(this.channels.augment, initMessage);
    this.logger.log('Initial handshake sent to Augment');
  }

  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const startTime = Date.now();
      let success = true;
      let errorDetails = '';
      
      const parsedMessage = JSON.parse(message) as AgentMessage;
      this.logger.debug(`Received message on channel ${channel}:`, parsedMessage);

      switch (parsedMessage.type) {
        case 'system':
          await this.handleSystemMessage(parsedMessage);
          break;
        case 'task':
          await this.handleTaskMessage(parsedMessage);
          break;
        case 'code_review':
          await this.handleCodeReviewMessage(parsedMessage);
          break;
        default:
          this.logger.warn(`Unhandled message type: ${parsedMessage.type}`);
          success = false;
          errorDetails = `Unhandled message type: ${parsedMessage.type}`;
      }
      
      // Record metrics
      const processingTime = Date.now() - startTime;
      this.monitor.recordMetric({
        messageType: parsedMessage.type,
        processingTime,
        success,
        errorDetails: success ? undefined : errorDetails
      });
      
    } catch (error) {
      this.logger.error('Error handling message:', error);
      
      // Record error metric
      this.monitor.recordMetric({
        messageType: 'unknown',
        processingTime: 0,
        success: false,
        errorDetails: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleSystemMessage(message: AgentMessage): Promise<void> {
    if (message.details?.action === 'initialize') {
      await this.sendAcknowledgment(message);
    }
  }

  private async handleTaskMessage(message: AgentMessage): Promise<void> {
    // Implement task handling logic
    this.logger.log(`Processing task: ${JSON.stringify(message.details)}`);
  }

  private async handleCodeReviewMessage(message: AgentMessage): Promise<void> {
    // Implement code review handling logic
    this.logger.log(`Processing code review: ${JSON.stringify(message.details)}`);
  }

  private async sendAcknowledgment(message: AgentMessage): Promise<void> {
    const ackMessage: AgentMessage = {
      type: 'system',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.1.0',
        priority: 'high',
        source: 'trae'
      },
      details: {
        action: 'acknowledge',
        replyTo: message.metadata.source,
        status: {
          monitoring: 'active',
          heartbeat: 'enabled',
          metrics: 'collecting'
        }
      }
    };

    await this.publishMessage(this.channels.augment, ackMessage);
  }

  private async publishMessage(channel: string, message: AgentMessage): Promise<void> {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      this.logger.error(`Failed to publish message to ${channel}:`, error);
      throw error;
    }
  }

  private handleError(error: Error): void {
    this.logger.error('Redis error:', error);
    this.isConnected = false;
  }

  public async cleanup(): Promise<void> {
    try {
      await this.subscriber.unsubscribe();
      await this.subscriber.quit();
      await this.redis.quit();
      await this.monitor.cleanup();
      this.isConnected = false;
      this.logger.log('Trae Agent cleaned up successfully');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      throw error;
    }
  }
}

// Start the Trae Agent client
async function main(): any {
  const client = new TraeAgentClient();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    
    await client.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    
    await client.cleanup();
    process.exit(0);
  });
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});