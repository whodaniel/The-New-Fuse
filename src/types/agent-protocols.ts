// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/types/agent-protocols.ts
/**
 * Agent Capability Enum
 * Defines the various capabilities that agents can have
 */
export enum AgentCapability {
  // Core capabilities
  REASONING = 'reasoning',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  
  // Data capabilities
  DATA_PROCESSING = 'data-processing',
  DATA_ANALYSIS = 'data-analysis',
  DATA_VISUALIZATION = 'data-visualization',
  
  // Communication capabilities
  TEXT_GENERATION = 'text-generation',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  
  // Knowledge capabilities
  INFORMATION_RETRIEVAL = 'information-retrieval',
  KNOWLEDGE_BASE = 'knowledge-base',
  RESEARCH = 'research',
  
  // Specialized capabilities
  CODE_GENERATION = 'code-generation',
  IMAGE_GENERATION = 'image-generation',
  AUDIO_PROCESSING = 'audio-processing',
  VIDEO_PROCESSING = 'video-processing',
  
  // Monitoring capabilities
  OBSERVABILITY = 'observability',
  ANOMALY_DETECTION = 'anomaly-detection',
  
  // Integration capabilities
  API_INTEGRATION = 'api-integration',
  TOOL_USE = 'tool-use',
  
  // Security capabilities
  SECURITY_ANALYSIS = 'security-analysis',
  CONTENT_MODERATION = 'content-moderation'
}

/**
 * Agent Protocol Enum
 * Defines the communication protocols that agents can support
 */
export enum AgentProtocol {
  // Standard protocols
  REST = 'rest',
  GRAPHQL = 'graphql',
  GRPC = 'grpc',
  WEBSOCKET = 'websocket',
  
  // AI-specific protocols
  OPENAI = 'openai',
  LANGCHAIN = 'langchain',
  MCP = 'mcp', // Model Context Protocol
  
  // Inter-agent protocols
  A2A = 'agent-to-agent',
  COLLECTIVE = 'collective',
  
  // Enterprise protocols
  ENTERPRISE_BUS = 'enterprise-bus',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq'
}

/**
 * Agent Trust Level Enum
 * Defines the trust levels for agents
 */
export enum AgentTrustLevel {
  UNTRUSTED = 'untrusted',
  LIMITED = 'limited',
  STANDARD = 'standard',
  TRUSTED = 'trusted',
  SYSTEM = 'system'
}

/**
 * Summarization Level Enum
 * Defines the different levels of summarization
 */
export enum SummarizationLevel {
  BRIEF = 'brief',         // Very short, key points only
  CONCISE = 'concise',     // Short but comprehensive
  DETAILED = 'detailed',   // More detail, preserves more content
  COMPREHENSIVE = 'comprehensive' // Extensive, preserves most important content
}

/**
 * Summarization Style Enum
 * Defines the different styles of summarization
 */
export enum SummarizationStyle {
  FACTUAL = 'factual',       // Just the facts
  ANALYTICAL = 'analytical', // Analysis and interpretation
  NARRATIVE = 'narrative',   // Story-like flow
  TECHNICAL = 'technical',   // Technical details emphasis
  SIMPLIFIED = 'simplified'  // Simplified language
}

/**
 * Content Priority Enum
 * Defines what content should be prioritized in summarization
 */
export enum ContentPriority {
  KEY_FINDINGS = 'key-findings',
  ACTION_ITEMS = 'action-items',
  DATA_POINTS = 'data-points',
  CONCEPTS = 'concepts',
  CHRONOLOGY = 'chronology',
  PEOPLE = 'people',
  ORGANIZATIONS = 'organizations',
  TECHNICAL_DETAILS = 'technical-details',
  IMPLICATIONS = 'implications'
}

/**
 * Agent Interface
 * Core interface for all agents
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  supportedProtocols: AgentProtocol[];
  trustLevel: AgentTrustLevel;
  status: 'idle' | 'busy' | 'error' | 'offline';
  lastUpdated?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent Registry Interface
 * Manages registration and discovery of agents
 */
export interface AgentRegistry {
  registerAgent(agent: Agent): Promise<boolean>;
  unregisterAgent(agentId: string): Promise<boolean>;
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(filter?: Partial<Agent>): Promise<Agent[]>;
  updateAgentStatus(agentId: string, status: Agent['status']): Promise<boolean>;
}

/**
 * Agent Message Interface
 * For communication between agents
 */
export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string | string[];
  action: string;
  payload: any;
  timestamp: string;
  correlationId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  expiration?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent Collective Interface
 * For groups of agents working together
 */
export interface AgentCollective {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Agent IDs
  orchestrator: string; // Agent ID of the orchestrator
  capabilities: AgentCapability[];
  supportedProtocols: AgentProtocol[];
  status: 'idle' | 'busy' | 'error' | 'offline';
  lastUpdated?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent Collective Registry Interface
 * Manages collectives of agents
 */
export interface AgentCollectiveRegistry {
  registerCollective(collective: AgentCollective): Promise<boolean>;
  unregisterCollective(collectiveId: string): Promise<boolean>;
  getCollective(collectiveId: string): Promise<AgentCollective | null>;
  listCollectives(filter?: Partial<AgentCollective>): Promise<AgentCollective[]>;
  addAgentToCollective(collectiveId: string, agentId: string): Promise<boolean>;
  removeAgentFromCollective(collectiveId: string, agentId: string): Promise<boolean>;
  updateCollectiveStatus(collectiveId: string, status: AgentCollective['status']): Promise<boolean>;
}