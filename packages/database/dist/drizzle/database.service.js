var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * DatabaseService - Unified Database Access Layer
 *
 * This service provides a centralized interface for all database operations,
 * wrapping Drizzle ORM repositories. It replaces the legacy DrizzleService.
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private db: DatabaseService) {}
 *
 *   async getUser(id: string) {
 *     return this.db.users.findById(id);
 *   }
 * }
 * ```
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, queryClient } from './client.js';
import { drizzleAgentApiGrantRepository, drizzleAgentManagedAccountRepository, drizzleAgentRepository, drizzleApiLogsRepository, drizzleChatRepository, drizzleJulesRepository, drizzleLLMConfigRepository, drizzleProviderApiKeyRepository, drizzleTaskRepository, drizzleUserRepository, drizzleWalletRepository, drizzleWebhookRepository, drizzleWorkflowRepository, drizzleWorkspaceMemberRepository, drizzleWorkspaceRepository, } from './repositories.js';
let DatabaseService = class DatabaseService {
    constructor() {
        this._isConnected = false;
        // The singleton db client is always available
        this._isConnected = true;
    }
    /**
     * Initialize the database connection
     */
    async onModuleInit() {
        try {
            await this.healthCheck();
            console.log('DatabaseService: Database connection verified');
        }
        catch (error) {
            console.error('DatabaseService: Failed to verify database connection:', error);
        }
    }
    /**
     * Cleanup database connection
     */
    async onModuleDestroy() {
        await this.$disconnect();
    }
    /**
     * Connect to the database (no-op for singleton pattern)
     */
    async $connect() {
        // The singleton db is already connected
        this._isConnected = true;
        console.log('DatabaseService: Connected to database');
    }
    /**
     * Disconnect from the database
     */
    async $disconnect() {
        try {
            await queryClient.end();
            this._isConnected = false;
            console.log('DatabaseService: Disconnected from database');
        }
        catch (error) {
            console.error('DatabaseService: Error disconnecting:', error);
        }
    }
    /**
     * Get the raw Drizzle client for direct queries
     */
    get client() {
        return db;
    }
    /**
     * Check if connected to database
     */
    get isConnected() {
        return this._isConnected;
    }
    // ==========================================================================
    // REPOSITORY ACCESSORS - Using singleton repository instances
    // ==========================================================================
    /**
     * User repository for user-related operations
     */
    get users() {
        return drizzleUserRepository;
    }
    /**
     * Agent repository for agent-related operations
     */
    get agents() {
        return drizzleAgentRepository;
    }
    /**
     * Agent API grant repository for delegated provider access controls
     */
    get agentApiGrants() {
        return drizzleAgentApiGrantRepository;
    }
    /**
     * Agent managed account repository for encrypted credential vault + grants
     */
    get agentManagedAccounts() {
        return drizzleAgentManagedAccountRepository;
    }
    /**
     * Jules repository for Jules integration operations
     */
    get jules() {
        return drizzleJulesRepository;
    }
    /**
     * Chat repository for chat/messaging operations
     */
    get chats() {
        return drizzleChatRepository;
    }
    /**
     * Task repository for task management
     */
    get tasks() {
        return drizzleTaskRepository;
    }
    /**
     * Workflow repository for workflow operations
     */
    get workflows() {
        return drizzleWorkflowRepository;
    }
    /**
     * Workspace repository for workspace management
     */
    get workspaces() {
        return drizzleWorkspaceRepository;
    }
    /**
     * Workspace members repository for workspace membership management
     */
    get workspaceMembers() {
        return drizzleWorkspaceMemberRepository;
    }
    /**
     * Webhook repository for webhook and business event operations
     */
    get webhooks() {
        return drizzleWebhookRepository;
    }
    /**
     * API logs repository
     */
    get apiLogs() {
        return drizzleApiLogsRepository;
    }
    /**
     * Wallet repository for wallet and transaction operations
     */
    get wallets() {
        return drizzleWalletRepository;
    }
    /**
     * LLM Config repository for LLM provider configuration
     */
    get llmConfigs() {
        return drizzleLLMConfigRepository;
    }
    /**
     * Provider API key repository for per-user secret storage
     */
    get providerApiKeys() {
        return drizzleProviderApiKeyRepository;
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    /**
     * Execute a raw SQL query
     */
    async executeRaw(query) {
        const result = await db.execute(sql.raw(query));
        return result;
    }
    /**
     * Health check - verify database connectivity
     */
    async healthCheck() {
        try {
            await db.execute(sql `SELECT 1`);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Run operations in a transaction
     * @param fn - Function that receives the transaction client
     */
    async transaction(fn) {
        return db.transaction(fn);
    }
};
DatabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], DatabaseService);
export { DatabaseService };
//# sourceMappingURL=database.service.js.map