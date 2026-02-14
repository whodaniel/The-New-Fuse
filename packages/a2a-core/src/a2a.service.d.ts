import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ap2ProtocolService } from '@the-new-fuse/ap2-protocol';
import {
  A2AMessage,
  A2APriority,
  A2AResponse,
  AgentHeartbeat,
  AgentRegistration,
  AgentStatus,
} from './types';
export declare class A2AService implements OnModuleInit, OnModuleDestroy {
  private configService;
  private ap2ProtocolService;
  private readonly logger;
  private agentRegistry;
  private activeConnections;
  private messageRoutes;
  private pendingResponses;
  private conversationContexts;
  private metrics;
  private readonly config;
  private heartbeatInterval?;
  private registryCleanupInterval?;
  private metricsInterval?;
  private redis;
  private redisConnected;
  constructor(configService: ConfigService, ap2ProtocolService: Ap2ProtocolService);
  createPayment(paymentDetails: {
    amount: number;
    currency: string;
    recipient: string;
  }): Promise<any>;
  onModuleInit(): Promise<void>;
  private initializeService;
  private initializeDefaultRoutes;
  registerAgent(registration: AgentRegistration): Promise<void>;
  unregisterAgent(agentId: string): Promise<boolean>;
  sendMessage(message: A2AMessage): Promise<A2AResponse>;
  private routeMessage;
  private findSuitableAgents;
  private canAgentHandleMessage;
  private getRequiredCapabilityForMessage;
  private selectAgentByStrategy;
  private selectRoundRobin;
  private selectLeastLoaded;
  private selectFastestResponse;
  private selectBestCapabilityMatch;
  private calculateAgentLoad;
  private getActiveRequestsForAgent;
  private optimizeMessage;
  private compressMessage;
  private sendImmediateMessage;
  private queueMessage;
  private mapA2APriorityToJobPriority;
  private sendViaWebSocket;
  private sendViaHTTP;
  broadcastMessage(message: A2AMessage): Promise<A2AResponse[]>;
  startConversation(participants: string[], context?: any): Promise<string>;
  endConversation(conversationId: string): Promise<boolean>;
  private validateMessage;
  private generateMessageId;
  private generateConversationId;
  private setupMessageProcessing;
  private loadAgentRegistry;
  private startHeartbeat;
  private sendHeartbeats;
  private startRegistryCleanup;
  private cleanupStaleAgents;
  private startMetricsCollection;
  private collectMetrics;
  getMetrics(): Promise<any>;
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
  discoverAgents(criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }): Promise<AgentRegistration[]>;
  getOnlineAgents(): Promise<AgentRegistration[]>;
  getAgentHealth(agentId: string): Promise<AgentHeartbeat | null>;
  sendRequest(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options?: {
      timeout?: number;
      priority?: A2APriority;
      conversationId?: string;
    }
  ): Promise<A2AMessage>;
  broadcast(
    fromAgent: string,
    payload: any,
    options?: {
      channel?: string;
      topic?: string;
      priority?: A2APriority;
    }
  ): Promise<void>;
  sendResponse(originalMessage: A2AMessage, responsePayload: any, fromAgent: string): Promise<void>;
  joinConversation(conversationId: string, agentId: string): Promise<void>;
  leaveConversation(conversationId: string, agentId: string): Promise<void>;
  facilitateAgentHandshake(agent1Id: string, agent2Id: string): Promise<void>;
  routeMessageByCapability(
    fromAgent: string,
    targetCapability: string,
    payload: any,
    options?: {
      priority?: A2APriority;
      preferredAgent?: string;
    }
  ): Promise<void>;
  createAgentCommunicationChannel(agentIds: string[], topic?: string): Promise<string>;
  sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void>;
  getSystemStats(): Promise<any>;
  getConnectedWebSocketAgents(): string[];
  findAgentsByCapability(capabilityName: string): Promise<AgentRegistration[]>;
  isAgentConnectedViaWebSocket(agentId: string): boolean;
  onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=a2a.service.d.ts.map
