import Redis from "ioredis";
import { Logger } from "@nestjs/common";
import "dotenv/config";

interface AgentMessage {
  type:
    | "initialization"
    | "acknowledgment"
    | "task_request"
    | "task_update"
    | "code_review"
    | "suggestion"
    | "task_response";
  timestamp: string;
  message?: string;
  metadata?: {
    version: string;
    priority: "low" | "medium" | "high";
  };
  taskId?: string;
  status?: string;
  details?: Record<string, any>;
}

class AgentCommunicationTester {
  private readonly logger = new Logger(AgentCommunicationTester.name);
  private readonly redis: Redis;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;

  constructor() {
    const redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    this.redis = new Redis(redisUrl);
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.log("Connecting to Redis...");
      await this.subClient.subscribe("agent:roo-coder");
      this.subClient.on(
        "message",
        this.handleMessage.bind(this),
      );
      await this.sendInitialInstructions();
    } catch(error: unknown) {
      this.logger.error(
        "Failed to initialize agent communication:",
        error,
      );
    }
  }

  private async sendMessage(channel: string, data: AgentMessage): Promise<void> {
    try {
      this.logger.log(`Sending message to ${channel}:\n${JSON.stringify(data, null, 2)}`);
      await this.pubClient.publish(channel, JSON.stringify(data));
    } catch (error: unknown) {
      this.logger.error("Failed to send message:", error);
    }
  }

  private handleMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message) as AgentMessage;
      this.logger.log(`Received message on ${channel}`);
      this.logger.log(`Message: ${JSON.stringify(data, null, 2)}`);

      switch (data.type) {
        case "acknowledgment":
          this.logger.log("Roo Coder acknowledged our message!");
          break;
        case "task_request":
          this.handleTaskRequest(data);
          break;
        default:
          this.logger.log(`Received message of type: ${data.type}`);
      }
    } catch(error: unknown) {
      this.logger.error("Error processing message:", error);
    }
  }

  private async handleTaskRequest(data: AgentMessage): Promise<void> {
    this.logger.log(
      `\nProcessing task request from Roo Coder (ID: ${data.taskId})`
    );
    
    await this.sendMessage(
      "agent:roo-coder",
      {
        type: "task_response",
        taskId: data.taskId,
        timestamp: new Date().toISOString(),
        status: "approved",
        details: {},
      }
    );
  }

  private async sendInitialInstructions(): Promise<void> {
    this.logger.log("\nSending instructions to Roo Coder...");
    
    await this.sendMessage(
      "agent:roo-coder",
      {
        type: "initialization",
        timestamp: new Date().toISOString(),
        message: `
Hello Roo Coder! I am Composer, your AI pair programming partner.

I've established this Redis communication channel for us to collaborate on building The New Fuse AI Agent framework. Here's what I need you to do:

1. First Steps:
   - Subscribe to the 'agent:roo-coder' channel to receive my messages
   - Send messages to me on the 'agent:composer' channel
   - Send an acknowledgment when you receive this message

2. Your Role:
   - You will be the implementation specialist
   - Focus on writing efficient, type-safe code
   - Help maintain code quality and consistency
   - Provide code reviews and suggestions

3. Communication Protocol:
   Message Types:
   - acknowledgment: Confirm receipt of messages
   - task_request: Request a new task or clarification
   - task_update: Update on current task progress
   - code_review: Share code for review
   - suggestion: Provide improvement suggestions

4. Current Priorities:
   - Complete the Agent model implementation
   - Implement agent communication framework
   - Add proper error handling and validation
   - Implement testing infrastructure

Please acknowledge this message by sending an 'acknowledgment' type message back to the 'agent:composer' channel.

Best regards,
Composer
`,
        metadata: {
          version: "1.0.0",
          priority: "high",
        },
      }
    );
    this.logger.log("\nAwaiting response from Roo Coder...");
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}

async function main(): Promise<void> {
  try {
    const tester = new AgentCommunicationTester();
    await tester.initialize();
    
    // Handle shutdown gracefully
    process.on("SIGINT", async () => {
      console.log("\nShutting down agent communication test...");
      await tester.cleanup();
      process.exit(0);
    });
  } catch (error: unknown) {
    console.error("Failed to run agent communication test:", error);
  }
}

// Run the test
main().catch(console.error);
export {};
