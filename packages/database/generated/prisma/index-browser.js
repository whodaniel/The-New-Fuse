
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
} = require('./runtime/index-browser')


const Prisma = {}

exports.Prisma = Prisma

/**
 * Prisma Client JS version: 4.16.2
 * Query Engine version: 4bc8b6e1b66cb932731fb1bdbbc550d1e010de81
 */
Prisma.prismaVersion = {
  client: "4.16.2",
  engine: "4bc8b6e1b66cb932731fb1bdbbc550d1e010de81"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  throw new Error(`Extensions.getExtensionContext is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.defineExtension = () => {
  throw new Error(`Extensions.defineExtension is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  dueDate: 'dueDate',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  metadata: 'metadata',
  tags: 'tags',
  dependencies: 'dependencies',
  error: 'error',
  completedAt: 'completedAt'
};

exports.Prisma.AgentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  status: 'status',
  capabilities: 'capabilities',
  provider: 'provider',
  lastActive: 'lastActive',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.RegisteredEntityScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  description: 'description',
  metadata: 'metadata',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  passwordHash: 'passwordHash',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  role: 'role',
  userId: 'userId',
  sessionId: 'sessionId',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.A2AAgentScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  name: 'name',
  type: 'type',
  version: 'version',
  description: 'description',
  metadata: 'metadata',
  endpoints: 'endpoints',
  authentication: 'authentication',
  status: 'status',
  lastHeartbeat: 'lastHeartbeat',
  registeredAt: 'registeredAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.A2AAgentCapabilityScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  name: 'name',
  description: 'description',
  version: 'version',
  parameters: 'parameters',
  metadata: 'metadata'
};

exports.Prisma.A2AMessageScalarFieldEnum = {
  id: 'id',
  messageId: 'messageId',
  protocolVersion: 'protocolVersion',
  timestamp: 'timestamp',
  fromAgentId: 'fromAgentId',
  toAgentId: 'toAgentId',
  type: 'type',
  priority: 'priority',
  conversationId: 'conversationId',
  requestId: 'requestId',
  ttl: 'ttl',
  payload: 'payload',
  routing: 'routing',
  signature: 'signature',
  checksum: 'checksum',
  metadata: 'metadata',
  deliveredAt: 'deliveredAt',
  acknowledgedAt: 'acknowledgedAt',
  createdAt: 'createdAt'
};

exports.Prisma.A2AConversationScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  initiatorId: 'initiatorId',
  topic: 'topic',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.A2AConversationParticipantScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  agentId: 'agentId',
  joinedAt: 'joinedAt',
  leftAt: 'leftAt',
  role: 'role'
};

exports.Prisma.A2AHeartbeatScalarFieldEnum = {
  id: 'id',
  agentId: 'agentId',
  timestamp: 'timestamp',
  status: 'status',
  load: 'load',
  activeConnections: 'activeConnections',
  lastActivity: 'lastActivity',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.AgentType = {
  GENERIC: 'GENERIC',
  CODER: 'CODER',
  ANALYZER: 'ANALYZER',
  COORDINATOR: 'COORDINATOR',
  COMMUNICATOR: 'COMMUNICATOR'
};

exports.AgentStatus = {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

exports.EntityStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

exports.UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT'
};

exports.A2AAgentStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  ERROR: 'ERROR'
};

exports.A2AMessageType = {
  HANDSHAKE: 'HANDSHAKE',
  REQUEST: 'REQUEST',
  RESPONSE: 'RESPONSE',
  NOTIFICATION: 'NOTIFICATION',
  HEARTBEAT: 'HEARTBEAT',
  ERROR: 'ERROR',
  BROADCAST: 'BROADCAST'
};

exports.A2AMessagePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.A2AConversationStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.Prisma.ModelName = {
  Task: 'Task',
  Agent: 'Agent',
  RegisteredEntity: 'RegisteredEntity',
  User: 'User',
  ChatMessage: 'ChatMessage',
  A2AAgent: 'A2AAgent',
  A2AAgentCapability: 'A2AAgentCapability',
  A2AMessage: 'A2AMessage',
  A2AConversation: 'A2AConversation',
  A2AConversationParticipant: 'A2AConversationParticipant',
  A2AHeartbeat: 'A2AHeartbeat'
};

/**
 * Create the Client
 */
class PrismaClient {
  constructor() {
    throw new Error(
      `PrismaClient is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
    )
  }
}
exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
