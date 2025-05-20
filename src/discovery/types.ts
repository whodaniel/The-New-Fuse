/**
 * Represents capabilities that an AI extension might have
 */
export type ExtensionCapability = 
  | 'code-generation'
  | 'code-explanation'
  | 'code-completion'
  | 'test-generation'
  | 'refactoring'
  | 'documentation'
  | 'code-review'
  | 'reasoning'
  | 'planning'
  | 'chat';

/**
 * Information about a registered agent
 */
export interface Agent {
  id: string;
  name: string;
  extensionId: string;
  capabilities: ExtensionCapability[];
  version: string;
  apiVersion: string;
  isActive: boolean;
}

/**
 * Registration request from an agent
 */
export interface AgentRegistrationRequest {
  id: string;
  name: string;
  capabilities: ExtensionCapability[];
  version: string;
  apiVersion: string;
}

/**
 * Events related to agent discovery
 */
export enum AgentEvent {
  REGISTERED = 'agent-registered',
  UNREGISTERED = 'agent-unregistered',
  CAPABILITY_CHANGED = 'agent-capability-changed',
  STATUS_CHANGED = 'agent-status-changed'
}

/**
 * Event data for agent events
 */
export interface AgentEventData {
  agent: Agent;
  type: AgentEvent;
  timestamp: number;
}
