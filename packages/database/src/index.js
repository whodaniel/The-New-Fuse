"use strict";
/**
 * Database Package - Drizzle ORM
 *
 * This package provides database access using Drizzle ORM.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentNftRepository = exports.DrizzleWorkspaceRepository = exports.DrizzleWorkspaceMemberRepository = exports.DrizzleWorkflowRepository = exports.DrizzleUserRepository = exports.DrizzleTaskRepository = exports.DrizzleProviderApiKeyRepository = exports.DrizzlePromptTemplateRepository = exports.DrizzleMarketplaceCatalogRepository = exports.DrizzleChatRepository = exports.DrizzleAuditLogsRepository = exports.DrizzleAgentRepository = exports.DrizzleAgentManagedAccountRepository = exports.DrizzleAgentApiGrantRepository = exports.workspaces = exports.workspaceMembers = exports.workflows = exports.workflowExecutions = exports.users = exports.tasks = exports.revenueStreams = exports.revenueDistributions = exports.providerApiKeys = exports.notifications = exports.messages = exports.marketplaceOffers = exports.marketplaceListings = exports.marketplaceCatalogItems = exports.fractionalShares = exports.chatRooms = exports.chatRoomParticipants = exports.authSessions = exports.agents = exports.agentRegistrations = exports.agentOnboardingEvents = exports.agentNfts = exports.agentMetrics = exports.agentManagedAccounts = exports.agentManagedAccountGrants = exports.agentDirectoryEntries = exports.agentCapabilityRegistry = exports.drizzleSchema = exports.DatabaseService = exports.schema = exports.queryClient = exports.db = exports.DrizzleService = exports.DrizzleModule = exports.DatabaseModule = exports.DRIZZLE_CLIENT = void 0;
exports.taskStatusEnum = exports.taskPriorityEnum = exports.agentTypeEnum = exports.agentStatusEnum = exports.sql = exports.or = exports.notInArray = exports.not = exports.ne = exports.lte = exports.lt = exports.like = exports.isNull = exports.isNotNull = exports.inArray = exports.ilike = exports.gte = exports.gt = exports.eq = exports.desc = exports.asc = exports.and = exports.WorkflowRepository = exports.WorkflowExecutionRepository = exports.UserRepository = exports.TaskRepository = exports.ChatRepository = exports.ChatMessageRepository = exports.AgentRepository = exports.workflowTopologyRepository = exports.validationDatasetRepository = exports.revenueStreamRepository = exports.revenueDistributionRepository = exports.optimizationJobRepository = exports.fractionalShareRepository = exports.drizzleWorkspaceRepository = exports.drizzleWorkspaceMemberRepository = exports.drizzleWorkflowRepository = exports.drizzleUserRepository = exports.drizzleTaskRepository = exports.drizzleProviderApiKeyRepository = exports.drizzlePromptTemplateRepository = exports.drizzleMarketplaceCatalogRepository = exports.drizzleChatRepository = exports.drizzleAuditLogsRepository = exports.drizzleApiLogsRepository = exports.drizzleAgentRepository = exports.drizzleAgentManagedAccountRepository = exports.drizzleAgentApiGrantRepository = exports.agentPromptVersionRepository = void 0;
exports.workflowStatusEnum = exports.workflowExecutionStatusEnum = exports.userRoleEnum = void 0;
// =============================================================================
// DRIZZLE ORM EXPORTS
// =============================================================================
// Export Drizzle client, module, and schema
var drizzle_1 = require("./drizzle");
Object.defineProperty(exports, "DRIZZLE_CLIENT", { enumerable: true, get: function () { return drizzle_1.DRIZZLE_CLIENT; } });
Object.defineProperty(exports, "DatabaseModule", { enumerable: true, get: function () { return drizzle_1.DrizzleModule; } });
Object.defineProperty(exports, "DrizzleModule", { enumerable: true, get: function () { return drizzle_1.DrizzleModule; } });
Object.defineProperty(exports, "DrizzleService", { enumerable: true, get: function () { return drizzle_1.DrizzleService; } });
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return drizzle_1.db; } });
Object.defineProperty(exports, "queryClient", { enumerable: true, get: function () { return drizzle_1.queryClient; } });
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return drizzle_1.schema; } });
// Export DatabaseService
var database_service_1 = require("./drizzle/database.service");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return database_service_1.DatabaseService; } });
// Export Drizzle schema tables
exports.drizzleSchema = __importStar(require("./drizzle/schema"));
// Export commonly used schema tables directly for convenience
var schema_1 = require("./drizzle/schema");
Object.defineProperty(exports, "agentCapabilityRegistry", { enumerable: true, get: function () { return schema_1.agentCapabilityRegistry; } });
Object.defineProperty(exports, "agentDirectoryEntries", { enumerable: true, get: function () { return schema_1.agentDirectoryEntries; } });
Object.defineProperty(exports, "agentManagedAccountGrants", { enumerable: true, get: function () { return schema_1.agentManagedAccountGrants; } });
Object.defineProperty(exports, "agentManagedAccounts", { enumerable: true, get: function () { return schema_1.agentManagedAccounts; } });
Object.defineProperty(exports, "agentMetrics", { enumerable: true, get: function () { return schema_1.agentMetrics; } });
Object.defineProperty(exports, "agentNfts", { enumerable: true, get: function () { return schema_1.agentNfts; } });
Object.defineProperty(exports, "agentOnboardingEvents", { enumerable: true, get: function () { return schema_1.agentOnboardingEvents; } });
Object.defineProperty(exports, "agentRegistrations", { enumerable: true, get: function () { return schema_1.agentRegistrations; } });
Object.defineProperty(exports, "agents", { enumerable: true, get: function () { return schema_1.agents; } });
Object.defineProperty(exports, "authSessions", { enumerable: true, get: function () { return schema_1.authSessions; } });
Object.defineProperty(exports, "chatRoomParticipants", { enumerable: true, get: function () { return schema_1.chatRoomParticipants; } });
Object.defineProperty(exports, "chatRooms", { enumerable: true, get: function () { return schema_1.chatRooms; } });
Object.defineProperty(exports, "fractionalShares", { enumerable: true, get: function () { return schema_1.fractionalShares; } });
Object.defineProperty(exports, "marketplaceCatalogItems", { enumerable: true, get: function () { return schema_1.marketplaceCatalogItems; } });
Object.defineProperty(exports, "marketplaceListings", { enumerable: true, get: function () { return schema_1.marketplaceListings; } });
Object.defineProperty(exports, "marketplaceOffers", { enumerable: true, get: function () { return schema_1.marketplaceOffers; } });
Object.defineProperty(exports, "messages", { enumerable: true, get: function () { return schema_1.messages; } });
Object.defineProperty(exports, "notifications", { enumerable: true, get: function () { return schema_1.notifications; } });
Object.defineProperty(exports, "providerApiKeys", { enumerable: true, get: function () { return schema_1.providerApiKeys; } });
Object.defineProperty(exports, "revenueDistributions", { enumerable: true, get: function () { return schema_1.revenueDistributions; } });
Object.defineProperty(exports, "revenueStreams", { enumerable: true, get: function () { return schema_1.revenueStreams; } });
Object.defineProperty(exports, "tasks", { enumerable: true, get: function () { return schema_1.tasks; } });
Object.defineProperty(exports, "users", { enumerable: true, get: function () { return schema_1.users; } });
Object.defineProperty(exports, "workflowExecutions", { enumerable: true, get: function () { return schema_1.workflowExecutions; } });
Object.defineProperty(exports, "workflows", { enumerable: true, get: function () { return schema_1.workflows; } });
Object.defineProperty(exports, "workspaceMembers", { enumerable: true, get: function () { return schema_1.workspaceMembers; } });
Object.defineProperty(exports, "workspaces", { enumerable: true, get: function () { return schema_1.workspaces; } });
// Export Drizzle repositories
var repositories_1 = require("./drizzle/repositories");
Object.defineProperty(exports, "DrizzleAgentApiGrantRepository", { enumerable: true, get: function () { return repositories_1.DrizzleAgentApiGrantRepository; } });
Object.defineProperty(exports, "DrizzleAgentManagedAccountRepository", { enumerable: true, get: function () { return repositories_1.DrizzleAgentManagedAccountRepository; } });
Object.defineProperty(exports, "DrizzleAgentRepository", { enumerable: true, get: function () { return repositories_1.DrizzleAgentRepository; } });
Object.defineProperty(exports, "DrizzleAuditLogsRepository", { enumerable: true, get: function () { return repositories_1.DrizzleAuditLogsRepository; } });
Object.defineProperty(exports, "DrizzleChatRepository", { enumerable: true, get: function () { return repositories_1.DrizzleChatRepository; } });
Object.defineProperty(exports, "DrizzleMarketplaceCatalogRepository", { enumerable: true, get: function () { return repositories_1.DrizzleMarketplaceCatalogRepository; } });
Object.defineProperty(exports, "DrizzlePromptTemplateRepository", { enumerable: true, get: function () { return repositories_1.DrizzlePromptTemplateRepository; } });
Object.defineProperty(exports, "DrizzleProviderApiKeyRepository", { enumerable: true, get: function () { return repositories_1.DrizzleProviderApiKeyRepository; } });
Object.defineProperty(exports, "DrizzleTaskRepository", { enumerable: true, get: function () { return repositories_1.DrizzleTaskRepository; } });
Object.defineProperty(exports, "DrizzleUserRepository", { enumerable: true, get: function () { return repositories_1.DrizzleUserRepository; } });
Object.defineProperty(exports, "DrizzleWorkflowRepository", { enumerable: true, get: function () { return repositories_1.DrizzleWorkflowRepository; } });
Object.defineProperty(exports, "DrizzleWorkspaceMemberRepository", { enumerable: true, get: function () { return repositories_1.DrizzleWorkspaceMemberRepository; } });
Object.defineProperty(exports, "DrizzleWorkspaceRepository", { enumerable: true, get: function () { return repositories_1.DrizzleWorkspaceRepository; } });
Object.defineProperty(exports, "agentNftRepository", { enumerable: true, get: function () { return repositories_1.agentNftRepository; } });
Object.defineProperty(exports, "agentPromptVersionRepository", { enumerable: true, get: function () { return repositories_1.agentPromptVersionRepository; } });
Object.defineProperty(exports, "drizzleAgentApiGrantRepository", { enumerable: true, get: function () { return repositories_1.drizzleAgentApiGrantRepository; } });
Object.defineProperty(exports, "drizzleAgentManagedAccountRepository", { enumerable: true, get: function () { return repositories_1.drizzleAgentManagedAccountRepository; } });
Object.defineProperty(exports, "drizzleAgentRepository", { enumerable: true, get: function () { return repositories_1.drizzleAgentRepository; } });
Object.defineProperty(exports, "drizzleApiLogsRepository", { enumerable: true, get: function () { return repositories_1.drizzleApiLogsRepository; } });
Object.defineProperty(exports, "drizzleAuditLogsRepository", { enumerable: true, get: function () { return repositories_1.drizzleAuditLogsRepository; } });
Object.defineProperty(exports, "drizzleChatRepository", { enumerable: true, get: function () { return repositories_1.drizzleChatRepository; } });
Object.defineProperty(exports, "drizzleMarketplaceCatalogRepository", { enumerable: true, get: function () { return repositories_1.drizzleMarketplaceCatalogRepository; } });
Object.defineProperty(exports, "drizzlePromptTemplateRepository", { enumerable: true, get: function () { return repositories_1.drizzlePromptTemplateRepository; } });
Object.defineProperty(exports, "drizzleProviderApiKeyRepository", { enumerable: true, get: function () { return repositories_1.drizzleProviderApiKeyRepository; } });
Object.defineProperty(exports, "drizzleTaskRepository", { enumerable: true, get: function () { return repositories_1.drizzleTaskRepository; } });
Object.defineProperty(exports, "drizzleUserRepository", { enumerable: true, get: function () { return repositories_1.drizzleUserRepository; } });
Object.defineProperty(exports, "drizzleWorkflowRepository", { enumerable: true, get: function () { return repositories_1.drizzleWorkflowRepository; } });
Object.defineProperty(exports, "drizzleWorkspaceMemberRepository", { enumerable: true, get: function () { return repositories_1.drizzleWorkspaceMemberRepository; } });
Object.defineProperty(exports, "drizzleWorkspaceRepository", { enumerable: true, get: function () { return repositories_1.drizzleWorkspaceRepository; } });
Object.defineProperty(exports, "fractionalShareRepository", { enumerable: true, get: function () { return repositories_1.fractionalShareRepository; } });
Object.defineProperty(exports, "optimizationJobRepository", { enumerable: true, get: function () { return repositories_1.optimizationJobRepository; } });
Object.defineProperty(exports, "revenueDistributionRepository", { enumerable: true, get: function () { return repositories_1.revenueDistributionRepository; } });
Object.defineProperty(exports, "revenueStreamRepository", { enumerable: true, get: function () { return repositories_1.revenueStreamRepository; } });
Object.defineProperty(exports, "validationDatasetRepository", { enumerable: true, get: function () { return repositories_1.validationDatasetRepository; } });
Object.defineProperty(exports, "workflowTopologyRepository", { enumerable: true, get: function () { return repositories_1.workflowTopologyRepository; } });
// Export backwards compatibility repository aliases
var compatibility_1 = require("./drizzle/compatibility");
Object.defineProperty(exports, "AgentRepository", { enumerable: true, get: function () { return compatibility_1.AgentRepository; } });
Object.defineProperty(exports, "ChatMessageRepository", { enumerable: true, get: function () { return compatibility_1.ChatMessageRepository; } });
Object.defineProperty(exports, "ChatRepository", { enumerable: true, get: function () { return compatibility_1.ChatRepository; } });
Object.defineProperty(exports, "TaskRepository", { enumerable: true, get: function () { return compatibility_1.TaskRepository; } });
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return compatibility_1.UserRepository; } });
Object.defineProperty(exports, "WorkflowExecutionRepository", { enumerable: true, get: function () { return compatibility_1.WorkflowExecutionRepository; } });
Object.defineProperty(exports, "WorkflowRepository", { enumerable: true, get: function () { return compatibility_1.WorkflowRepository; } });
// Export Drizzle query utilities
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "asc", { enumerable: true, get: function () { return drizzle_orm_1.asc; } });
Object.defineProperty(exports, "desc", { enumerable: true, get: function () { return drizzle_orm_1.desc; } });
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "ilike", { enumerable: true, get: function () { return drizzle_orm_1.ilike; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "isNotNull", { enumerable: true, get: function () { return drizzle_orm_1.isNotNull; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
Object.defineProperty(exports, "like", { enumerable: true, get: function () { return drizzle_orm_1.like; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "ne", { enumerable: true, get: function () { return drizzle_orm_1.ne; } });
Object.defineProperty(exports, "not", { enumerable: true, get: function () { return drizzle_orm_1.not; } });
Object.defineProperty(exports, "notInArray", { enumerable: true, get: function () { return drizzle_orm_1.notInArray; } });
Object.defineProperty(exports, "or", { enumerable: true, get: function () { return drizzle_orm_1.or; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
// Re-export pg enums from schema for backward compatibility
// Note: These are pgEnum types, not TypeScript enums
var schema_2 = require("./drizzle/schema");
Object.defineProperty(exports, "agentStatusEnum", { enumerable: true, get: function () { return schema_2.agentStatusEnum; } });
Object.defineProperty(exports, "agentTypeEnum", { enumerable: true, get: function () { return schema_2.agentTypeEnum; } });
Object.defineProperty(exports, "taskPriorityEnum", { enumerable: true, get: function () { return schema_2.taskPriorityEnum; } });
Object.defineProperty(exports, "taskStatusEnum", { enumerable: true, get: function () { return schema_2.taskStatusEnum; } });
Object.defineProperty(exports, "userRoleEnum", { enumerable: true, get: function () { return schema_2.userRoleEnum; } });
Object.defineProperty(exports, "workflowExecutionStatusEnum", { enumerable: true, get: function () { return schema_2.workflowExecutionStatusEnum; } });
Object.defineProperty(exports, "workflowStatusEnum", { enumerable: true, get: function () { return schema_2.workflowStatusEnum; } });
//# sourceMappingURL=index.js.map