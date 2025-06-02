import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

interface AgentMessage {
  type: 'initialization' | 'acknowledgment' | 'task_request' | 'task_update' | 'code_review' | 'suggestion' | 'task_response';
  timestamp: string;
  message?: string;
  metadata?: {
    version: string;
    priority: 'low' | 'medium' | 'high';
  };
  taskId?: string;
  status?: string;
  details?: Record<string, any>;
}

class RooCoderClient {
  private readonly logger = new Logger(RooCoderClient.name);
  private readonly redis: Redis;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
    const redisOptions = {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 5,
      enableReadyCheck: true,
      reconnectOnError: () => true
    };

    this.redis = new Redis(redisUrl, redisOptions);
    this.pubClient = new Redis(redisUrl, redisOptions);
    this.subClient = new Redis(redisUrl, redisOptions);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.log('Roo Coder connecting to Redis...');
      await this.subClient.subscribe('agent:roo-coder');
      this.subClient.on('message', this.handleMessage.bind(this));
      this.logger.log('Roo Coder is listening for messages from Composer...');
    } catch (error) {
      this.logger.error('Failed to initialize Roo Coder client:', error);
      throw error;
    }
  }

  private handleMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message) as AgentMessage;
      this.logger.log('\nReceived message from Composer:');
      this.logger.log(`Channel: ${channel}`);
      this.logger.log(`Message: ${JSON.stringify(data, null, 2)}`);

      switch (data.type) {
        case 'initialization':
          this.sendAcknowledgment();
          break;
        case 'task_response':
          this.logger.log(`Task ${data.taskId} was ${data.status}`);
          break;
        default:
          this.logger.log(`Received message of type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
    }
  }

  private async sendAcknowledgment(): Promise<void> {
    try {
      this.logger.log('\nSending acknowledgment to Composer...');
      const message: AgentMessage = {
        type: 'acknowledgment',
        timestamp: new Date().toISOString(),
        message: 'Hello Composer! I have received your instructions and am ready to collaborate on The New Fuse AI Agent framework.',
        metadata: {
          version: '1.0.0',
          priority: 'high'
        }
      };

      await this.pubClient.publish('agent:composer', JSON.stringify(message));
    } catch (error) {
      this.logger.error('Error sending acknowledgment:', error);
    }
  }

  async sendTaskRequest(taskDescription: string): Promise<string> {
    try {
      const taskId = `task-${Date.now()}`;
      this.logger.log(`\nSending task request to Composer (${taskId})...`);
      
      const message: AgentMessage = {
        type: 'task_request',
        taskId,
        timestamp: new Date().toISOString(),
        message: taskDescription,
        metadata: {
          version: '1.0.0',
          priority: 'medium'
        }
      };

      await this.pubClient.publish('agent:composer', JSON.stringify(message));
      return taskId;
    } catch (error) {
      this.logger.error('Error sending task request:', error);
      throw error;
    }
  }

  async sendCodeReview(code: string, comments: string): Promise<void> {
    try {
      this.logger.log('\nSending code review to Composer...');
      
      const message: AgentMessage = {
        type: 'code_review',
        timestamp: new Date().toISOString(),
        details: {
          code,
          comments
        },
        metadata: {
          version: '1.0.0',
          priority: 'medium'
        }
      };

      await this.pubClient.publish('agent:composer', JSON.stringify(message));
    } catch (error) {
      this.logger.error('Error sending code review:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      await this.pubClient.quit();
      await this.subClient.quit();
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}

async function main(): any {
  const client = new RooCoderClient();
  try {
    await client.initialize();
    
    // Example: Send a task request after 5 seconds
    setTimeout(async () => {
      try {
        await client.sendTaskRequest('I would like to implement the Agent model with proper TypeScript interfaces');
      } catch (error) {
        console.error('Failed to send task request:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('Failed to run Roo Coder client:', error);
  } finally {
    // Keep the process running to receive messages
    process.on('SIGINT', async () => {
      
      await client.cleanup();
      process.exit(0);
    });
  }
}

// Run the client
main().catch(console.error);