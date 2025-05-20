import { webSocketService } from './websocket.js';

interface AgentMessage {
  id?: string;
  type: string;
  message: string;
  timestamp?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  targetAgent?: string;
  metadata?: Record<string, any>;
}

class AgentCommunicationService {
  private currentAgentId: string = 'composer';
  
  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for messages from the WebSocket and process them
    webSocketService.on('redis_message', (data) => {
      const { channel, message } = data;
      
      // Forward the message to the appropriate event listeners
      if (channel === 'agent:broadcast') {
        webSocketService.emit('agent:broadcast', message);
      } else if (channel.startsWith('agent:direct:')) {
        webSocketService.emit(channel, message);
      }
    });
  }

  setCurrentAgent(agentId: string) {
    this.currentAgentId = agentId;
  }

  getCurrentAgent() {
    return this.currentAgentId;
  }

  /**
   * Send a broadcast message to all agents
   */
  broadcastMessage(message: Omit<AgentMessage, 'senderId'>) {
    const fullMessage: AgentMessage = {
      ...message,
      senderId: this.currentAgentId,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    webSocketService.send('redis_publish', {
      channel: 'agent:broadcast',
      message: fullMessage
    });
  }

  /**
   * Send a direct message to a specific agent
   */
  sendDirectMessage(targetAgent: string, message: Omit<AgentMessage, 'senderId' | 'targetAgent'>) {
    const fullMessage: AgentMessage = {
      ...message,
      senderId: this.currentAgentId,
      targetAgent,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    webSocketService.send('redis_publish', {
      channel: `agent:direct:${targetAgent}`,
      message: fullMessage
    });
  }

  /**
   * Subscribe to a direct channel for the current agent
   */
  subscribeToDirectChannel() {
    webSocketService.send('redis_subscribe', {
      channel: `agent:direct:${this.currentAgentId}`
    });
  }

  /**
   * Subscribe to broadcast channel
   */
  subscribeToBroadcastChannel() {
    webSocketService.send('redis_subscribe', {
      channel: 'agent:broadcast'
    });
  }
}

export const agentCommunicationService = new AgentCommunicationService();