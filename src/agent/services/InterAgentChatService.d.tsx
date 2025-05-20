import { MonitoringService } from './MonitoringService.js';
import { AlertService } from './AlertService.js';
export interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
export interface ChatMetrics {
  messagesSent: number;
  messagesReceived: number;
  averageResponseTime: number;
  activeChannels: string[];
}
export declare class InterAgentChatService {
  private readonly eventEmitter;
  private readonly monitoringService;
  private readonly alertService;
  private readonly logger;
  private readonly redis;
  private readonly channels;
  private metrics;
  constructor(
    eventEmitter: EventEmitter2,
    monitoringService: MonitoringService,
    alertService: AlertService,
  );
  private setupRedisSubscriptions;
  private setupMetricsReporting;
  private handleIncomingMessage;
  private updateActiveChannels;
  private routeMessage;
  sendMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<void>;
  getChatMetrics(): Promise<ChatMetrics>;
  disconnect(): Promise<void>;
}
