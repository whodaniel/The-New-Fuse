import { PrismaClient as BasePrismaClient } from '@prisma/client';
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum AgentStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    ERROR = "ERROR",
    OFFLINE = "OFFLINE"
}
export declare enum AgentType {
    GENERIC = "GENERIC",
    CODER = "CODER",
    ANALYZER = "ANALYZER",
    COORDINATOR = "COORDINATOR",
    COMMUNICATOR = "COMMUNICATOR"
}
export declare enum EntityStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING"
}
export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    AGENT = "AGENT"
}
export declare enum A2AAgentStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
    BUSY = "BUSY",
    IDLE = "IDLE",
    ERROR = "ERROR"
}
export declare enum A2AMessageType {
    HANDSHAKE = "HANDSHAKE",
    REQUEST = "REQUEST",
    RESPONSE = "RESPONSE",
    NOTIFICATION = "NOTIFICATION",
    HEARTBEAT = "HEARTBEAT",
    ERROR = "ERROR",
    BROADCAST = "BROADCAST"
}
export declare enum A2AMessagePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum A2AConversationStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum MarketplaceStatus {
    ACTIVE = "ACTIVE",
    SOLD = "SOLD",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare enum OfferStatus {
    ACTIVE = "ACTIVE",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare enum WorkflowStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED"
}
export declare enum WorkflowExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
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
    workflow?: Workflow;
}
export declare const PrismaClient: typeof BasePrismaClient;
export type PrismaClient = BasePrismaClient;
//# sourceMappingURL=types.d.ts.map