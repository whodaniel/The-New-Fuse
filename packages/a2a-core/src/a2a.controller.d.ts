import { A2AService } from './a2a.service';
import { A2AMessage, A2APriority, AgentHeartbeat, AgentRegistration, AgentStatus } from './types';
export declare class A2AController {
  private readonly a2aService;
  private readonly logger;
  constructor(a2aService: A2AService);
  registerAgent(registration: AgentRegistration): Promise<{
    success: boolean;
    message: string;
  }>;
  unregisterAgent(agentId: string): Promise<void>;
  updateAgentStatus(
    agentId: string,
    body: {
      status: AgentStatus;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  discoverAgents(
    type?: string,
    capabilities?: string,
    status?: AgentStatus
  ): Promise<{
    agents: {
      agentId: string;
      name: string;
      type: import('./types').AgentType;
      version: string;
      capabilities: string[];
      description?: string | undefined;
      metadata?: Record<string, any> | undefined;
      endpoints?:
        | {
            websocket?: string | undefined;
            http?: string | undefined;
            redis?: string | undefined;
          }
        | undefined;
      authentication?:
        | {
            type: 'none' | 'token' | 'certificate';
            credentials?: Record<string, string> | undefined;
          }
        | undefined;
      maxConcurrentRequests?: number | undefined;
      averageResponseTime?: number | undefined;
      reliability?: number | undefined;
      lastSeen?: number | undefined;
      isOnline?: boolean | undefined;
    }[];
    count: number;
  }>;
  getOnlineAgents(): Promise<{
    agents: {
      agentId: string;
      name: string;
      type: import('./types').AgentType;
      version: string;
      capabilities: string[];
      description?: string | undefined;
      metadata?: Record<string, any> | undefined;
      endpoints?:
        | {
            websocket?: string | undefined;
            http?: string | undefined;
            redis?: string | undefined;
          }
        | undefined;
      authentication?:
        | {
            type: 'none' | 'token' | 'certificate';
            credentials?: Record<string, string> | undefined;
          }
        | undefined;
      maxConcurrentRequests?: number | undefined;
      averageResponseTime?: number | undefined;
      reliability?: number | undefined;
      lastSeen?: number | undefined;
      isOnline?: boolean | undefined;
    }[];
    count: number;
  }>;
  getAgentHealth(agentId: string): Promise<
    | {
        agentId: string;
        timestamp: string;
        status: AgentStatus;
        load?: number | undefined;
        activeConnections?: number | undefined;
        lastActivity?: string | undefined;
        metadata?: Record<string, any> | undefined;
      }
    | {
        status: string;
        message: string;
      }
  >;
  sendMessage(message: A2AMessage): Promise<{
    success: boolean;
    messageId: string;
  }>;
  sendRequest(body: {
    fromAgent: string;
    toAgent: string;
    payload: any;
    timeout?: number;
    priority?: A2APriority;
    conversationId?: string;
  }): Promise<{
    response: A2AMessage;
  }>;
  broadcast(body: {
    fromAgent: string;
    payload: any;
    channel?: string;
    topic?: string;
    priority?: A2APriority;
  }): Promise<{
    success: boolean;
    message: string;
  }>;
  sendResponse(body: {
    originalMessage: A2AMessage;
    responsePayload: any;
    fromAgent: string;
  }): Promise<{
    success: boolean;
    message: string;
  }>;
  startConversation(body: { initiator: string; participants: string[]; topic?: string }): Promise<{
    conversationId: string;
  }>;
  joinConversation(
    conversationId: string,
    body: {
      agentId: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  leaveConversation(
    conversationId: string,
    body: {
      agentId: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  facilitateHandshake(body: { agent1Id: string; agent2Id: string }): Promise<{
    success: boolean;
    message: string;
  }>;
  routeMessageByCapability(body: {
    fromAgent: string;
    targetCapability: string;
    payload: any;
    priority?: A2APriority;
    preferredAgent?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }>;
  createCommunicationChannel(body: { agentIds: string[]; topic?: string }): Promise<{
    conversationId: string;
  }>;
  sendHeartbeat(
    agentId: string,
    heartbeat: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  getSystemStats(): Promise<any>;
  getConnectionStatus(): Promise<{
    websocketConnections: string[];
    totalConnected: number;
  }>;
  createPayment(paymentDetails: {
    amount: number;
    currency: string;
    recipient: string;
  }): Promise<any>;
  findAgentsByCapability(capabilityName: string): Promise<{
    agents: {
      agentId: string;
      name: string;
      type: import('./types').AgentType;
      version: string;
      capabilities: string[];
      description?: string | undefined;
      metadata?: Record<string, any> | undefined;
      endpoints?:
        | {
            websocket?: string | undefined;
            http?: string | undefined;
            redis?: string | undefined;
          }
        | undefined;
      authentication?:
        | {
            type: 'none' | 'token' | 'certificate';
            credentials?: Record<string, string> | undefined;
          }
        | undefined;
      maxConcurrentRequests?: number | undefined;
      averageResponseTime?: number | undefined;
      reliability?: number | undefined;
      lastSeen?: number | undefined;
      isOnline?: boolean | undefined;
    }[];
    count: number;
  }>;
  isAgentConnected(agentId: string): Promise<{
    agentId: string;
    connected: boolean;
  }>;
}
//# sourceMappingURL=a2a.controller.d.ts.map
