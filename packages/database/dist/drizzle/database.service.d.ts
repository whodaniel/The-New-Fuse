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
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Database } from './client.js';
import { DrizzleAgentApiGrantRepository, DrizzleAgentManagedAccountRepository, DrizzleAgentRepository, DrizzleApiLogsRepository, DrizzleChatRepository, DrizzleJulesRepository, DrizzleLLMConfigRepository, DrizzleProviderApiKeyRepository, DrizzleTaskRepository, DrizzleUserRepository, DrizzleWalletRepository, DrizzleWebhookRepository, DrizzleWorkflowRepository, DrizzleWorkspaceMemberRepository, DrizzleWorkspaceRepository } from './repositories.js';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private _isConnected;
    constructor();
    /**
     * Initialize the database connection
     */
    onModuleInit(): Promise<void>;
    /**
     * Cleanup database connection
     */
    onModuleDestroy(): Promise<void>;
    /**
     * Connect to the database (no-op for singleton pattern)
     */
    $connect(): Promise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): Promise<void>;
    /**
     * Get the raw Drizzle client for direct queries
     */
    get client(): Database;
    /**
     * Check if connected to database
     */
    get isConnected(): boolean;
    /**
     * User repository for user-related operations
     */
    get users(): DrizzleUserRepository;
    /**
     * Agent repository for agent-related operations
     */
    get agents(): DrizzleAgentRepository;
    /**
     * Agent API grant repository for delegated provider access controls
     */
    get agentApiGrants(): DrizzleAgentApiGrantRepository;
    /**
     * Agent managed account repository for encrypted credential vault + grants
     */
    get agentManagedAccounts(): DrizzleAgentManagedAccountRepository;
    /**
     * Jules repository for Jules integration operations
     */
    get jules(): DrizzleJulesRepository;
    /**
     * Chat repository for chat/messaging operations
     */
    get chats(): DrizzleChatRepository;
    /**
     * Task repository for task management
     */
    get tasks(): DrizzleTaskRepository;
    /**
     * Workflow repository for workflow operations
     */
    get workflows(): DrizzleWorkflowRepository;
    /**
     * Workspace repository for workspace management
     */
    get workspaces(): DrizzleWorkspaceRepository;
    /**
     * Workspace members repository for workspace membership management
     */
    get workspaceMembers(): DrizzleWorkspaceMemberRepository;
    /**
     * Webhook repository for webhook and business event operations
     */
    get webhooks(): DrizzleWebhookRepository;
    /**
     * API logs repository
     */
    get apiLogs(): DrizzleApiLogsRepository;
    /**
     * Wallet repository for wallet and transaction operations
     */
    get wallets(): DrizzleWalletRepository;
    /**
     * LLM Config repository for LLM provider configuration
     */
    get llmConfigs(): DrizzleLLMConfigRepository;
    /**
     * Provider API key repository for per-user secret storage
     */
    get providerApiKeys(): DrizzleProviderApiKeyRepository;
    /**
     * Execute a raw SQL query
     */
    executeRaw<T = unknown>(query: string): Promise<T[]>;
    /**
     * Health check - verify database connectivity
     */
    healthCheck(): Promise<boolean>;
    /**
     * Run operations in a transaction
     * @param fn - Function that receives the transaction client
     */
    transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=database.service.d.ts.map