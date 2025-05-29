
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
  agencyId: 'agencyId'
};

exports.Prisma.AgencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  subdomain: 'subdomain',
  slug: 'slug',
  subscriptionTier: 'subscriptionTier',
  subscriptionStatus: 'subscriptionStatus',
  billingEmail: 'billingEmail',
  branding: 'branding',
  settings: 'settings',
  userLimit: 'userLimit',
  agentLimit: 'agentLimit',
  storageLimit: 'storageLimit',
  isActive: 'isActive',
  trialEndsAt: 'trialEndsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  passwordHash: 'passwordHash',
  agencyId: 'agencyId',
  role: 'role',
  permissions: 'permissions',
  isActive: 'isActive',
  onboardingCompleted: 'onboardingCompleted',
  emailVerified: 'emailVerified',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  title: 'title',
  createdBy: 'createdBy',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  agencyId: 'agencyId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.SwarmExecutionScalarFieldEnum = {
  id: 'id',
  serviceRequestId: 'serviceRequestId',
  agencyId: 'agencyId',
  status: 'status',
  qualityScore: 'qualityScore',
  activeAgents: 'activeAgents',
  executionPlan: 'executionPlan',
  results: 'results',
  startedAt: 'startedAt',
  completedAt: 'completedAt'
};

exports.Prisma.ExecutionStepScalarFieldEnum = {
  id: 'id',
  swarmExecutionId: 'swarmExecutionId',
  stepId: 'stepId',
  agentId: 'agentId',
  action: 'action',
  input: 'input',
  output: 'output',
  status: 'status',
  qualityScore: 'qualityScore',
  confidence: 'confidence',
  startedAt: 'startedAt',
  completedAt: 'completedAt'
};

exports.Prisma.SwarmMessageScalarFieldEnum = {
  id: 'id',
  swarmExecutionId: 'swarmExecutionId',
  fromAgentId: 'fromAgentId',
  toAgentId: 'toAgentId',
  type: 'type',
  priority: 'priority',
  content: 'content',
  metadata: 'metadata',
  status: 'status',
  processedAt: 'processedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ServiceCategoryScalarFieldEnum = {
  id: 'id',
  parentId: 'parentId',
  name: 'name',
  description: 'description',
  slug: 'slug',
  isActive: 'isActive',
  requiresApproval: 'requiresApproval',
  estimatedDuration: 'estimatedDuration',
  basePricing: 'basePricing',
  complexityFactors: 'complexityFactors',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceProviderScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  agentId: 'agentId',
  categoryId: 'categoryId',
  capabilities: 'capabilities',
  qualityRating: 'qualityRating',
  completionRate: 'completionRate',
  averageRating: 'averageRating',
  totalCompletions: 'totalCompletions',
  isActive: 'isActive',
  maxConcurrent: 'maxConcurrent',
  currentLoad: 'currentLoad',
  pricingOverride: 'pricingOverride',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceRequestScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  userId: 'userId',
  categoryId: 'categoryId',
  providerId: 'providerId',
  title: 'title',
  description: 'description',
  requirements: 'requirements',
  status: 'status',
  priority: 'priority',
  estimatedCost: 'estimatedCost',
  actualCost: 'actualCost',
  qualityScore: 'qualityScore',
  clientSatisfaction: 'clientSatisfaction',
  requestedAt: 'requestedAt',
  assignedAt: 'assignedAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  dueDate: 'dueDate',
  deliverables: 'deliverables',
  notes: 'notes'
};

exports.Prisma.ProviderReviewScalarFieldEnum = {
  id: 'id',
  providerId: 'providerId',
  reviewerId: 'reviewerId',
  rating: 'rating',
  comment: 'comment',
  criteria: 'criteria',
  serviceType: 'serviceType',
  createdAt: 'createdAt'
};

exports.Prisma.ServiceReviewScalarFieldEnum = {
  id: 'id',
  serviceRequestId: 'serviceRequestId',
  reviewerId: 'reviewerId',
  overallRating: 'overallRating',
  qualityRating: 'qualityRating',
  speedRating: 'speedRating',
  communicationRating: 'communicationRating',
  comment: 'comment',
  recommendations: 'recommendations',
  createdAt: 'createdAt'
};

exports.Prisma.AgencySubscriptionScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  tier: 'tier',
  status: 'status',
  billingCycle: 'billingCycle',
  pricePerMonth: 'pricePerMonth',
  currency: 'currency',
  startedAt: 'startedAt',
  endsAt: 'endsAt',
  renewedAt: 'renewedAt',
  cancelledAt: 'cancelledAt',
  stripeSubscriptionId: 'stripeSubscriptionId',
  paymentMethodId: 'paymentMethodId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgencyAuditLogScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  changes: 'changes',
  metadata: 'metadata',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
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

exports.AgentStatus = {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

exports.AgencyTier = {
  TRIAL: 'TRIAL',
  BASIC: 'BASIC',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE'
};

exports.SubscriptionStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
  INCOMPLETE: 'INCOMPLETE',
  INCOMPLETE_EXPIRED: 'INCOMPLETE_EXPIRED',
  UNPAID: 'UNPAID'
};

exports.EnhancedUserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  AGENCY_OWNER: 'AGENCY_OWNER',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
  AGENCY_MANAGER: 'AGENCY_MANAGER',
  AGENCY_USER: 'AGENCY_USER',
  AGENT_OPERATOR: 'AGENT_OPERATOR'
};

exports.SwarmExecutionStatus = {
  INITIALIZING: 'INITIALIZING',
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  COORDINATING: 'COORDINATING',
  FINALIZING: 'FINALIZING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.ExecutionStepStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  RETRYING: 'RETRYING'
};

exports.MessageType = {
  TASK_ASSIGNMENT: 'TASK_ASSIGNMENT',
  STATUS_UPDATE: 'STATUS_UPDATE',
  RESULT_SHARING: 'RESULT_SHARING',
  COORDINATION: 'COORDINATION',
  ERROR_REPORT: 'ERROR_REPORT',
  RESOURCE_REQUEST: 'RESOURCE_REQUEST'
};

exports.MessagePriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.MessageStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.ServiceRequestStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

exports.RequestPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.BillingCycle = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
};

exports.Prisma.ModelName = {
  Task: 'Task',
  Agent: 'Agent',
  Agency: 'Agency',
  User: 'User',
  Chat: 'Chat',
  Session: 'Session',
  SwarmExecution: 'SwarmExecution',
  ExecutionStep: 'ExecutionStep',
  SwarmMessage: 'SwarmMessage',
  ServiceCategory: 'ServiceCategory',
  ServiceProvider: 'ServiceProvider',
  ServiceRequest: 'ServiceRequest',
  ProviderReview: 'ProviderReview',
  ServiceReview: 'ServiceReview',
  AgencySubscription: 'AgencySubscription',
  AgencyAuditLog: 'AgencyAuditLog'
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
