// Custom types based on the Prisma schema
// This is a temporary solution until Prisma client generation works properly
import { PrismaClient as BasePrismaClient } from '@prisma/client';
// Enums from schema
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (TaskPriority = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
})(AgentStatus || (AgentStatus = {}));
export var AgentType;
(function (AgentType) {
    AgentType["GENERIC"] = "GENERIC";
    AgentType["CODER"] = "CODER";
    AgentType["ANALYZER"] = "ANALYZER";
    AgentType["COORDINATOR"] = "COORDINATOR";
    AgentType["COMMUNICATOR"] = "COMMUNICATOR";
})(AgentType || (AgentType = {}));
export var EntityStatus;
(function (EntityStatus) {
    EntityStatus["ACTIVE"] = "ACTIVE";
    EntityStatus["INACTIVE"] = "INACTIVE";
    EntityStatus["PENDING"] = "PENDING";
})(EntityStatus || (EntityStatus = {}));
export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["AGENT"] = "AGENT";
})(UserRole || (UserRole = {}));
export var A2AAgentStatus;
(function (A2AAgentStatus) {
    A2AAgentStatus["ONLINE"] = "ONLINE";
    A2AAgentStatus["OFFLINE"] = "OFFLINE";
    A2AAgentStatus["BUSY"] = "BUSY";
    A2AAgentStatus["IDLE"] = "IDLE";
    A2AAgentStatus["ERROR"] = "ERROR";
})(A2AAgentStatus || (A2AAgentStatus = {}));
export var A2AMessageType;
(function (A2AMessageType) {
    A2AMessageType["HANDSHAKE"] = "HANDSHAKE";
    A2AMessageType["REQUEST"] = "REQUEST";
    A2AMessageType["RESPONSE"] = "RESPONSE";
    A2AMessageType["NOTIFICATION"] = "NOTIFICATION";
    A2AMessageType["HEARTBEAT"] = "HEARTBEAT";
    A2AMessageType["ERROR"] = "ERROR";
    A2AMessageType["BROADCAST"] = "BROADCAST";
})(A2AMessageType || (A2AMessageType = {}));
export var A2AMessagePriority;
(function (A2AMessagePriority) {
    A2AMessagePriority["LOW"] = "LOW";
    A2AMessagePriority["MEDIUM"] = "MEDIUM";
    A2AMessagePriority["HIGH"] = "HIGH";
    A2AMessagePriority["URGENT"] = "URGENT";
})(A2AMessagePriority || (A2AMessagePriority = {}));
export var A2AConversationStatus;
(function (A2AConversationStatus) {
    A2AConversationStatus["ACTIVE"] = "ACTIVE";
    A2AConversationStatus["PAUSED"] = "PAUSED";
    A2AConversationStatus["COMPLETED"] = "COMPLETED";
    A2AConversationStatus["FAILED"] = "FAILED";
})(A2AConversationStatus || (A2AConversationStatus = {}));
export var MarketplaceStatus;
(function (MarketplaceStatus) {
    MarketplaceStatus["ACTIVE"] = "ACTIVE";
    MarketplaceStatus["SOLD"] = "SOLD";
    MarketplaceStatus["CANCELLED"] = "CANCELLED";
    MarketplaceStatus["EXPIRED"] = "EXPIRED";
})(MarketplaceStatus || (MarketplaceStatus = {}));
export var OfferStatus;
(function (OfferStatus) {
    OfferStatus["ACTIVE"] = "ACTIVE";
    OfferStatus["ACCEPTED"] = "ACCEPTED";
    OfferStatus["REJECTED"] = "REJECTED";
    OfferStatus["CANCELLED"] = "CANCELLED";
    OfferStatus["EXPIRED"] = "EXPIRED";
})(OfferStatus || (OfferStatus = {}));
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["ACTIVE"] = "ACTIVE";
    WorkflowStatus["ARCHIVED"] = "ARCHIVED";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["SUCCEEDED"] = "SUCCEEDED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
// Re-export PrismaClient from the real @prisma/client
export const PrismaClient = BasePrismaClient;
