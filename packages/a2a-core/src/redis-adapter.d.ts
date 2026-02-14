import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
import {
  A2AConfig,
  A2AMessage,
  A2APriority,
  AgentHeartbeat,
  AgentRegistration,
  AgentStatus,
  IA2ACommunicator,
} from './types';
export declare class A2ARedisAdapter
  extends EventEmitter
  implements IA2ACommunicator, OnModuleInit, OnModuleDestroy
{
  private readonly config;
  private readonly redisService;
  private readonly logger;
  private readonly keyPrefix;
  private readonly requestTimeouts;
  private readonly pendingRequests;
  private isConnected;
  constructor(config: A2AConfig, redisService: UnifiedRedisService);
  onModuleInit(): Promise<void>;
  /**
   * Check if Redis is connected and available for A2A communication
   */
  get connected(): boolean;
  /**
   * Helper method to check connection before operations
   */
  private ensureConnected;
  onModuleDestroy(): Promise<void>;
  private setupSubscriptions;
  private handleRedisMessage;
  private handleResponse;
  private handleSystemEvent;
  registerAgent(registration: AgentRegistration): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
  sendMessage(message: A2AMessage): Promise<void>;
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
  startConversation(initiator: string, participants: string[], topic?: string): Promise<string>;
  joinConversation(conversationId: string, agentId: string): Promise<void>;
  leaveConversation(conversationId: string, agentId: string): Promise<void>;
  discoverAgents(criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }): Promise<AgentRegistration[]>;
  sendHeartbeat(heartbeat: AgentHeartbeat): Promise<void>;
  getAgentHealth(agentId: string): Promise<AgentHeartbeat | null>;
  private storeMessage;
  private publishSystemEvent;
}
//# sourceMappingURL=redis-adapter.d.ts.map
