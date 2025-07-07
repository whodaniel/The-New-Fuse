/**
 * This file serves as the main entry point for the database package.
 * It exports the Prisma client instance and the generated types.
 */
export { User, Agent, Task, RegisteredEntity, ChatMessage, A2AAgent, A2AAgentCapability, A2AMessage, A2AConversation, A2AConversationParticipant, A2AHeartbeat, AgentNFT, FractionalShare, RevenueStream, RevenueDistribution, MarketplaceListing, MarketplaceOffer, Workflow, WorkflowExecution, PrismaClient, UserRole, AgentType, AgentStatus, TaskStatus, TaskPriority, EntityStatus, A2AAgentStatus, A2AMessageType, A2AMessagePriority, A2AConversationStatus, MarketplaceStatus, OfferStatus, WorkflowStatus, WorkflowExecutionStatus, } from './types';
export * from './database.module';
export * from './prisma.service';
export * from './repositories/base.repository';
export * from './repositories/agent.repository';
export * from './repositories/user.repository';
export * from './repositories/chat-message.repository';
export * from './repositories/workflow.repository';
export * from './repositories/workflow-execution.repository';
export * from './repositories/task.repository';
//# sourceMappingURL=index.d.ts.map