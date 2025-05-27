import { AgentRegistration as CanonicalAgentRegistration } from '../types.js';
export { CanonicalAgentRegistration as AgentRegistration };

export interface AgentMessage {
  id: string;
  timestamp: number;
  type: string;
  sender: string;
  recipient: string;
  payload: any;
  processed?: boolean;
  metadata?: Record<string, any>;
  command?: string;
}

export interface WebViewMessage {
  type: string;
  text?: string;
  payload?: any;
}

export enum MessageType {
  USER_MESSAGE = 'USER_MESSAGE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE',
  AI_MESSAGE = 'AI_MESSAGE',
  ERROR_MESSAGE = 'ERROR_MESSAGE',
  STATUS_UPDATE = 'STATUS_UPDATE'
}

export interface AIMessage {
  type: MessageType;
  text: string;
  sender?: string;
  timestamp: number;
}
