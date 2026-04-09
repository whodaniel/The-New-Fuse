import { Logger } from '@nestjs/common';
import { WebSocketTestClient } from './websocket-client';

export interface LoadTestConfig {
  url: string;
  numClients: number;
  messageInterval: number;
  duration: number;
  messageSize?: number;
  auth?: {
    token: string;
  };
}

export interface LoadTestResults {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  errors: number;
  duration: number;
  messagesPerSecond: number;
}

export class WebSocketLoadTester {
  private readonly logger = new Logger(WebSocketLoadTester.name);
  private clients: WebSocketTestClient[] = [];
  private results: LoadTestResults = {
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    averageLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    errors: 0,
    duration: 0,
    messagesPerSecond: 0,
  };
  private latencies: number[] = [];

  constructor(private readonly config: LoadTestConfig) {}

  /**
   * Run load test
   */
  async run(): Promise<LoadTestResults> {
    this.logger.log(`Starting load test with ${this.config.numClients} clients`);
    const startTime = Date.now();

    try {
      // Create and connect clients
      await this.createClients();

      // Send messages
      await this.sendMessages();

      // Wait for duration
      await this.wait(this.config.duration);

      // Calculate results
      const endTime = Date.now();
      this.results.duration = endTime - startTime;
      this.calculateResults();

      this.logger.log('Load test completed');
      return this.results;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Create clients
   */
  private async createClients(): Promise<void> {
    this.logger.log('Creating clients...');

    const promises = [];
    for (let i = 0; i < this.config.numClients; i++) {
      const client = new WebSocketTestClient({
        url: this.config.url,
        auth: this.config.auth,
        reconnection: {
          enabled: true,
        },
      });

      this.clients.push(client);

      promises.push(
        client
          .connect()
          .then(() => {
            this.results.successfulConnections++;
            this.setupClientHandlers(client);
          })
          .catch((error) => {
            this.logger.error(`Failed to connect client ${i}: ${error.message}`);
            this.results.failedConnections++;
            this.results.errors++;
          })
      );
    }

    await Promise.all(promises);
    this.results.totalConnections = this.config.numClients;
    this.logger.log(
      `Connected ${this.results.successfulConnections}/${this.config.numClients} clients`
    );
  }

  /**
   * Setup client event handlers
   */
  private setupClientHandlers(client: WebSocketTestClient): void {
    client.on('test:response', (data) => {
      this.results.totalMessagesReceived++;

      // Calculate latency
      if (data.timestamp) {
        const latency = Date.now() - data.timestamp;
        this.latencies.push(latency);

        if (latency < this.results.minLatency) {
          this.results.minLatency = latency;
        }
        if (latency > this.results.maxLatency) {
          this.results.maxLatency = latency;
        }
      }
    });
  }

  /**
   * Send messages from all clients
   */
  private async sendMessages(): Promise<void> {
    this.logger.log('Starting to send messages...');

    const interval = setInterval(() => {
      for (const client of this.clients) {
        if (client.isConnected()) {
          try {
            const message = this.generateMessage();
            client.send('test:request', message);
            this.results.totalMessagesSent++;
          } catch (error) {
            this.logger.error(`Error sending message: ${(error as Error).message}`);
            this.results.errors++;
          }
        }
      }
    }, this.config.messageInterval);

    // Store interval for cleanup
    (this as any).messageInterval = interval;
  }

  /**
   * Generate test message
   */
  private generateMessage(): any {
    const messageSize = this.config.messageSize || 100;
    return {
      timestamp: Date.now(),
      data: 'x'.repeat(messageSize),
    };
  }

  /**
   * Wait for specified duration
   */
  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  /**
   * Calculate final results
   */
  private calculateResults(): void {
    if (this.latencies.length > 0) {
      const sum = this.latencies.reduce((a, b) => a + b, 0);
      this.results.averageLatency = sum / this.latencies.length;
    }

    if (this.results.duration > 0) {
      this.results.messagesPerSecond =
        (this.results.totalMessagesSent / this.results.duration) * 1000;
    }

    this.logger.log(`
Load Test Results:
==================
Total Connections: ${this.results.totalConnections}
Successful: ${this.results.successfulConnections}
Failed: ${this.results.failedConnections}
Messages Sent: ${this.results.totalMessagesSent}
Messages Received: ${this.results.totalMessagesReceived}
Average Latency: ${this.results.averageLatency.toFixed(2)}ms
Min Latency: ${this.results.minLatency}ms
Max Latency: ${this.results.maxLatency}ms
Errors: ${this.results.errors}
Duration: ${(this.results.duration / 1000).toFixed(2)}s
Messages/Second: ${this.results.messagesPerSecond.toFixed(2)}
    `);
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.logger.log('Cleaning up...');

    // Stop sending messages
    if ((this as any).messageInterval) {
      clearInterval((this as any).messageInterval);
    }

    // Disconnect all clients
    for (const client of this.clients) {
      try {
        client.disconnect();
      } catch (error) {
        this.logger.error(`Error disconnecting client: ${(error as Error).message}`);
      }
    }

    this.clients = [];
  }
}
