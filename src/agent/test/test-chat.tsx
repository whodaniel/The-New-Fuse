import { InterAgentChatService } from '../services/InterAgentChatService.js';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MonitoringService } from '../services/MonitoringService.js';
import { AlertService } from '../services/AlertService.js';
import { PrometheusService } from '../services/PrometheusService.js';
import { RedisService } from '../services/RedisService.js';

interface MetricsData {
  type: string;
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    averageResponseTime: number;
    activeChannels: string[];
  };
}

interface MessageProcessedData {
  message: {
    id: string;
    sender: string;
    recipient: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  };
  duration: number;
  success: boolean;
  waitTime: number;
}

async function testInterAgentCommunication() => Promise<void> {): Promise<any> {
  const eventEmitter: MetricsData)  = new EventEmitter2(): ", data): MessageProcessedData)  = new PrometheusService();
  const redisService = new RedisService();
  const monitoringService = new MonitoringService(
    prometheusService,
    redisService,
    eventEmitter,
  );
  const alertService = new AlertService(eventEmitter);

  const chatService = new InterAgentChatService(
    eventEmitter,
    monitoringService,
    alertService,
  );

  // Subscribe to monitoring events
  eventEmitter.on("monitoring.metrics.updated", (data> {
    
  });

  try {
    // Send a test message from Trae to Augment
    await chatService.sendMessage({
      sender: "trae",
      recipient: "augment",
      content: "Hello Augment, this is a test message from Trae",
      metadata: {
        type: "test",
        timestamp: new Date(): ", metrics);

    // Cleanup
    await chatService.disconnect();
  } catch(error: unknown) {
    console.error("Test failed:", error);
  }
}

// Run the test
testInterAgentCommunication().catch(console.error);
export {};
