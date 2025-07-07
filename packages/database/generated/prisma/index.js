// Comprehensive Prisma client exports
const { PrismaClient } = require('@prisma/client');

// Enums from schema
const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const AgentStatus = {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

const AgentType = {
  GENERIC: 'GENERIC',
  CODER: 'CODER',
  ANALYZER: 'ANALYZER',
  COORDINATOR: 'COORDINATOR',
  COMMUNICATOR: 'COMMUNICATOR'
};

const EntityStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT'
};

const A2AAgentStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  ERROR: 'ERROR'
};

const A2AMessageType = {
  HANDSHAKE: 'HANDSHAKE',
  REQUEST: 'REQUEST',
  RESPONSE: 'RESPONSE',
  NOTIFICATION: 'NOTIFICATION',
  HEARTBEAT: 'HEARTBEAT',
  ERROR: 'ERROR',
  BROADCAST: 'BROADCAST'
};

const A2AMessagePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const A2AConversationStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const MarketplaceStatus = {
  ACTIVE: 'ACTIVE',
  SOLD: 'SOLD',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

const OfferStatus = {
  ACTIVE: 'ACTIVE',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

const WorkflowStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
};

const WorkflowExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// Special Prisma values
const JsonNull = null;
const DbNull = null;
const AnyNull = null;

// Error classes
class PrismaClientKnownRequestError extends Error {
  constructor(message, code, clientVersion, meta) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
  }
}

class PrismaClientUnknownRequestError extends Error {
  constructor(message, clientVersion) {
    super(message);
    this.name = 'PrismaClientUnknownRequestError';
  }
}

class PrismaClientRustPanicError extends Error {
  constructor(message, clientVersion) {
    super(message);
    this.name = 'PrismaClientRustPanicError';
  }
}

class PrismaClientInitializationError extends Error {
  constructor(message, clientVersion) {
    super(message);
    this.name = 'PrismaClientInitializationError';
  }
}

class PrismaClientValidationError extends Error {
  constructor(message, clientVersion) {
    super(message);
    this.name = 'PrismaClientValidationError';
  }
}

module.exports = {
  PrismaClient,
  Prisma: {
    TaskStatus,
    TaskPriority,
    AgentStatus,
    AgentType,
    EntityStatus,
    UserRole,
    A2AAgentStatus,
    A2AMessageType,
    A2AMessagePriority,
    A2AConversationStatus,
    MarketplaceStatus,
    OfferStatus,
    WorkflowStatus,
    WorkflowExecutionStatus,
    JsonNull,
    DbNull,
    AnyNull,
    PrismaClientKnownRequestError,
    PrismaClientUnknownRequestError,
    PrismaClientRustPanicError,
    PrismaClientInitializationError,
    PrismaClientValidationError
  },
  // Re-export enums for direct access
  TaskStatus,
  TaskPriority,
  AgentStatus,
  AgentType,
  EntityStatus,
  UserRole,
  A2AAgentStatus,
  A2AMessageType,
  A2AMessagePriority,
  A2AConversationStatus,
  MarketplaceStatus,
  OfferStatus,
  WorkflowStatus,
  WorkflowExecutionStatus
};