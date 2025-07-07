// Custom types based on the Prisma schema
// This is a temporary solution until Prisma client generation works properly

import { PrismaClient as BasePrismaClient } from '@prisma/client';

// Enums from schema
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export enum AgentType {
  GENERIC = 'GENERIC',
  CODER = 'CODER',
  ANALYZER = 'ANALYZER',
  COORDINATOR = 'COORDINATOR',
  COMMUNICATOR = 'COMMUNICATOR'
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
}

export enum A2AAgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  IDLE = 'IDLE',
  ERROR = 'ERROR'
}

export enum A2AMessageType {
  HANDSHAKE = 'HANDSHAKE',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NOTIFICATION = 'NOTIFICATION',
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR',
  BROADCAST = 'BROADCAST'
}

export enum A2AMessagePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum A2AConversationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum MarketplaceStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Model types based on schema
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
  metadata?: any;
  tags: string[];
  dependencies: string[];
  error?: string;
  completedAt?: Date;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  provider: string;
  lastActive: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  
  // Relations (optional)
  user?: User;
  nft?: AgentNFT;
}

export interface RegisteredEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  metadata?: any;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  agents?: Agent[];
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: string;
  userId: string;
  sessionId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  user?: User;
}

export interface A2AAgent {
  id: string;
  agentId: string;
  name: string;
  type: string;
  version: string;
  description?: string;
  metadata?: any;
  endpoints?: any;
  authentication?: any;
  status: A2AAgentStatus;
  lastHeartbeat?: Date;
  registeredAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  capabilities?: A2AAgentCapability[];
  sentMessages?: A2AMessage[];
  receivedMessages?: A2AMessage[];
  conversations?: A2AConversationParticipant[];
  heartbeats?: A2AHeartbeat[];
}

export interface A2AAgentCapability {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  version: string;
  parameters?: any;
  metadata?: any;
  
  // Relations (optional)
  agent?: A2AAgent;
}

export interface A2AMessage {
  id: string;
  messageId: string;
  protocolVersion: string;
  timestamp: Date;
  fromAgentId: string;
  toAgentId?: string;
  type: A2AMessageType;
  priority: A2AMessagePriority;
  conversationId?: string;
  requestId?: string;
  ttl?: number;
  payload: any;
  routing?: any;
  signature?: string;
  checksum?: string;
  metadata?: any;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  
  // Relations (optional)
  fromAgent?: A2AAgent;
  toAgent?: A2AAgent;
  conversation?: A2AConversation;
}

export interface A2AConversation {
  id: string;
  conversationId: string;
  initiatorId: string;
  topic?: string;
  status: A2AConversationStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  participants?: A2AConversationParticipant[];
  messages?: A2AMessage[];
}

export interface A2AConversationParticipant {
  id: string;
  conversationId: string;
  agentId: string;
  joinedAt: Date;
  leftAt?: Date;
  role?: string;
  
  // Relations (optional)
  conversation?: A2AConversation;
  agent?: A2AAgent;
}

export interface A2AHeartbeat {
  id: string;
  agentId: string;
  timestamp: Date;
  status: A2AAgentStatus;
  load?: number;
  activeConnections?: number;
  lastActivity?: Date;
  metadata?: any;
  createdAt: Date;
  
  // Relations (optional)
  agent?: A2AAgent;
}

export interface AgentNFT {
  id: string;
  agentId: string;
  tokenId: number;
  contractAddress: string;
  smartAccountAddress?: string;
  isFractionalized: boolean;
  totalShares: number;
  metadataUri?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  agent?: Agent;
  fractionalShares?: FractionalShare[];
  revenueStreams?: RevenueStream[];
  marketplaceListings?: MarketplaceListing[];
}

export interface FractionalShare {
  id: string;
  agentNFTId: string;
  ownerAddress: string;
  shareAmount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  agentNFT?: AgentNFT;
}

export interface RevenueStream {
  id: string;
  agentNFTId: string;
  streamName: string;
  description?: string;
  tokenAddress: string;
  totalRevenue: string;
  distributedRevenue: string;
  distributionThreshold: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  agentNFT?: AgentNFT;
  distributions?: RevenueDistribution[];
}

export interface RevenueDistribution {
  id: string;
  revenueStreamId: string;
  txHash: string;
  totalAmount: string;
  distributedTo: any;
  blockNumber: number;
  createdAt: Date;
  
  // Relations (optional)
  revenueStream?: RevenueStream;
}

export interface MarketplaceListing {
  id: string;
  agentNFTId: string;
  listingId: number;
  seller: string;
  shareAmount: number;
  pricePerShare: string;
  totalPrice: string;
  status: MarketplaceStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  agentNFT?: AgentNFT;
  offers?: MarketplaceOffer[];
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  offerId: number;
  buyer: string;
  offerPrice: string;
  shareAmount: number;
  status: OfferStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  listing?: MarketplaceListing;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  definition: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  executions?: WorkflowExecution[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  input?: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  workflow?: Workflow;
}

// Re-export PrismaClient from the real @prisma/client
export const PrismaClient = BasePrismaClient;
export type PrismaClient = BasePrismaClient;