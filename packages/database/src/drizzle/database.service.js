"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
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
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("./client");
const repositories_1 = require("./repositories");
let DatabaseService = class DatabaseService {
    _isConnected = false;
    constructor() {
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
            await client_1.queryClient.end();
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
        return client_1.db;
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
        return repositories_1.drizzleUserRepository;
    }
    /**
     * Agent repository for agent-related operations
     */
    get agents() {
        return repositories_1.drizzleAgentRepository;
    }
    /**
     * Agent API grant repository for delegated provider access controls
     */
    get agentApiGrants() {
        return repositories_1.drizzleAgentApiGrantRepository;
    }
    /**
     * Agent managed account repository for encrypted credential vault + grants
     */
    get agentManagedAccounts() {
        return repositories_1.drizzleAgentManagedAccountRepository;
    }
    /**
     * Jules repository for Jules integration operations
     */
    get jules() {
        return repositories_1.drizzleJulesRepository;
    }
    /**
     * Chat repository for chat/messaging operations
     */
    get chats() {
        return repositories_1.drizzleChatRepository;
    }
    /**
     * Task repository for task management
     */
    get tasks() {
        return repositories_1.drizzleTaskRepository;
    }
    /**
     * Workflow repository for workflow operations
     */
    get workflows() {
        return repositories_1.drizzleWorkflowRepository;
    }
    /**
     * Workspace repository for workspace management
     */
    get workspaces() {
        return repositories_1.drizzleWorkspaceRepository;
    }
    /**
     * Workspace members repository for workspace membership management
     */
    get workspaceMembers() {
        return repositories_1.drizzleWorkspaceMemberRepository;
    }
    /**
     * Workspace bookmarks repository for workspace quick links
     */
    get workspaceBookmarks() {
        return repositories_1.drizzleWorkspaceBookmarkRepository;
    }
    /**
     * Workspace domains repository for custom domain management
     */
    get workspaceDomains() {
        return repositories_1.drizzleWorkspaceDomainRepository;
    }
    /**
     * Webhook repository for webhook and business event operations
     */
    get webhooks() {
        return repositories_1.drizzleWebhookRepository;
    }
    /**
     * API logs repository
     */
    get apiLogs() {
        return repositories_1.drizzleApiLogsRepository;
    }
    /**
     * Wallet repository for wallet and transaction operations
     */
    get wallets() {
        return repositories_1.drizzleWalletRepository;
    }
    /**
     * LLM Config repository for LLM provider configuration
     */
    get llmConfigs() {
        return repositories_1.drizzleLLMConfigRepository;
    }
    /**
     * Provider API key repository for per-user secret storage
     */
    get providerApiKeys() {
        return repositories_1.drizzleProviderApiKeyRepository;
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    /**
     * Execute a raw SQL query
     */
    async executeRaw(query) {
        const result = await client_1.db.execute(drizzle_orm_1.sql.raw(query));
        return result;
    }
    /**
     * Health check - verify database connectivity
     */
    async healthCheck() {
        try {
            await client_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
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
        return client_1.db.transaction(fn);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DatabaseService);
//# sourceMappingURL=database.service.js.map