/**
 * Represents an AI agent registered with the orchestrator
 */
export interface Agent {
  id: string;
  capabilities: AgentCapability[];
  metadata: any;
  registered: number;
  lastSeen: number;
}

/**
 * Represents a capability that an agent can provide
 */
export interface AgentCapability {
  name: string;
  description: string;
  parameters?: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    }
  };
}

/**
 * Represents a message sent between agents
 */
export interface Message {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'delivered' | 'failed';
  response?: any;
  error?: string;
}

/**
 * Result of validating a message
 */
export interface MessageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * FIPA ACL inspired message structure for more complex interactions
 */
export interface ACLMessage {
  // Basic message properties
  performative: 'inform' | 'request' | 'query' | 'propose' | 'accept' | 'reject';
  sender: string;
  receiver: string;
  content: any;
  
  // Conversation management
  conversationId: string;
  inReplyTo?: string;
  replyWith?: string;
  
  // Message metadata
  language: string;
  ontology?: string;
  timestamp: number;
}