export type MessageType = 'REQUEST' | 'RESPONSE' | 'NOTIFICATION' | 'ERROR';
export type AgentStatus = 'online' | 'offline' | 'busy';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface A2AAgent {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  status: AgentStatus;
  metadata?: Record<string, any>;
}

export interface A2AMessage {
  id: string;
  type: MessageType;
  fromAgent: string;
  toAgent: string;
  payload: any;
  timestamp: number;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
}

export interface A2AContextValue {
  url: string;
  isConnected: boolean;
  agents: A2AAgent[];
  messages: A2AMessage[];
  sendMessage: (message: Omit<A2AMessage, 'id' | 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
}

export interface A2AProviderProps {
  url: string;
  children: React.ReactNode;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}