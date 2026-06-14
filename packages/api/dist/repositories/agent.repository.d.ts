/**
 * Agent Repository - Drizzle ORM Implementation
 *
 * This repository provides data access for Agent entities using Drizzle ORM.
 * It replaces the legacy Drizzle-based repository.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
declare const agents: import("drizzle-orm/pg-core/table", { with: { "resolution-mode": "require" } }).PgTableWithColumns<{
    name: "agents";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "id";
            tableName: "agents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "name";
            tableName: "agents";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        type: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "type";
            tableName: "agents";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "BASIC" | "CHAT" | "WORKFLOW" | "TASK" | "ASSISTANT" | "ANALYSIS" | "CONVERSATIONAL" | "IDE_EXTENSION" | "API" | "ORCHESTRATOR" | "BROKER" | "MONITOR" | "VALIDATOR" | "ROUTER" | "SCHEDULER" | "GATEWAY" | "CLI_CODER" | "CLI_DEBUGGER" | "CLI_DEVOPS" | "CLI_DATABASE" | "CLI_GIT" | "CLI_SHELL" | "IDE_VSCODE" | "IDE_CURSOR" | "IDE_WINDSURF" | "IDE_JETBRAINS" | "IDE_NEOVIM" | "IDE_EMACS" | "BROWSER_GEMINI" | "BROWSER_CLAUDE" | "BROWSER_CHATGPT" | "BROWSER_COPILOT" | "BROWSER_PERPLEXITY" | "BROWSER_PHIND" | "GITHUB_JULES" | "GITHUB_COPILOT" | "GITHUB_ACTIONS" | "GITHUB_CODESPACES" | "CODE_GENERATOR" | "CODE_REVIEWER" | "CODE_REFACTORER" | "CODE_DOCUMENTER" | "CODE_TESTER" | "CODE_ARCHITECT" | "CODE_OPTIMIZER" | "CODE_SECURITY" | "CODE_MIGRATOR" | "CODE_TRANSLATOR" | "DATA_ANALYST" | "DATA_ENGINEER" | "DATA_SCIENTIST" | "DATA_VISUALIZER" | "DATA_CLEANER" | "DATA_VALIDATOR" | "INFRA_DEVOPS" | "INFRA_CLOUD" | "INFRA_KUBERNETES" | "INFRA_DOCKER" | "INFRA_TERRAFORM" | "INFRA_MONITORING" | "DOC_WRITER" | "DOC_API" | "DOC_README" | "DOC_CHANGELOG" | "DOC_TUTORIAL" | "TEST_UNIT" | "TEST_INTEGRATION" | "TEST_E2E" | "TEST_PERFORMANCE" | "TEST_SECURITY" | "TEST_ACCESSIBILITY" | "AI_TRAINER" | "AI_EVALUATOR" | "AI_PROMPT_ENGINEER" | "AI_RAG" | "AI_EMBEDDINGS" | "AI_FINE_TUNER" | "COMM_TRANSLATOR" | "COMM_SUMMARIZER" | "COMM_WRITER" | "COMM_EMAIL" | "COMM_SLACK" | "COMM_DISCORD" | "RESEARCH_WEB" | "RESEARCH_ACADEMIC" | "RESEARCH_MARKET" | "RESEARCH_COMPETITOR" | "DOMAIN_LEGAL" | "DOMAIN_FINANCE" | "DOMAIN_HEALTHCARE" | "DOMAIN_EDUCATION" | "DOMAIN_ECOMMERCE" | "DOMAIN_GAMING" | "TNF_CORE" | "TNF_ONBOARDING" | "TNF_COORDINATOR" | "TNF_HANDOFF" | "TNF_HEARTBEAT" | "TNF_CLEANUP";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["BASIC", "CHAT", "WORKFLOW", "TASK", "ASSISTANT", "ANALYSIS", "CONVERSATIONAL", "IDE_EXTENSION", "API", "ORCHESTRATOR", "BROKER", "MONITOR", "VALIDATOR", "ROUTER", "SCHEDULER", "GATEWAY", "CLI_CODER", "CLI_DEBUGGER", "CLI_DEVOPS", "CLI_DATABASE", "CLI_GIT", "CLI_SHELL", "IDE_VSCODE", "IDE_CURSOR", "IDE_WINDSURF", "IDE_JETBRAINS", "IDE_NEOVIM", "IDE_EMACS", "BROWSER_GEMINI", "BROWSER_CLAUDE", "BROWSER_CHATGPT", "BROWSER_COPILOT", "BROWSER_PERPLEXITY", "BROWSER_PHIND", "GITHUB_JULES", "GITHUB_COPILOT", "GITHUB_ACTIONS", "GITHUB_CODESPACES", "CODE_GENERATOR", "CODE_REVIEWER", "CODE_REFACTORER", "CODE_DOCUMENTER", "CODE_TESTER", "CODE_ARCHITECT", "CODE_OPTIMIZER", "CODE_SECURITY", "CODE_MIGRATOR", "CODE_TRANSLATOR", "DATA_ANALYST", "DATA_ENGINEER", "DATA_SCIENTIST", "DATA_VISUALIZER", "DATA_CLEANER", "DATA_VALIDATOR", "INFRA_DEVOPS", "INFRA_CLOUD", "INFRA_KUBERNETES", "INFRA_DOCKER", "INFRA_TERRAFORM", "INFRA_MONITORING", "DOC_WRITER", "DOC_API", "DOC_README", "DOC_CHANGELOG", "DOC_TUTORIAL", "TEST_UNIT", "TEST_INTEGRATION", "TEST_E2E", "TEST_PERFORMANCE", "TEST_SECURITY", "TEST_ACCESSIBILITY", "AI_TRAINER", "AI_EVALUATOR", "AI_PROMPT_ENGINEER", "AI_RAG", "AI_EMBEDDINGS", "AI_FINE_TUNER", "COMM_TRANSLATOR", "COMM_SUMMARIZER", "COMM_WRITER", "COMM_EMAIL", "COMM_SLACK", "COMM_DISCORD", "RESEARCH_WEB", "RESEARCH_ACADEMIC", "RESEARCH_MARKET", "RESEARCH_COMPETITOR", "DOMAIN_LEGAL", "DOMAIN_FINANCE", "DOMAIN_HEALTHCARE", "DOMAIN_EDUCATION", "DOMAIN_ECOMMERCE", "DOMAIN_GAMING", "TNF_CORE", "TNF_ONBOARDING", "TNF_COORDINATOR", "TNF_HANDOFF", "TNF_HEARTBEAT", "TNF_CLEANUP"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "status";
            tableName: "agents";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "ACTIVE" | "INACTIVE" | "IDLE" | "BUSY" | "ERROR" | "OFFLINE" | "INITIALIZING" | "READY" | "TERMINATED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["ACTIVE", "INACTIVE", "IDLE", "BUSY", "ERROR", "OFFLINE", "INITIALIZING", "READY", "TERMINATED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "description";
            tableName: "agents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        systemPrompt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "system_prompt";
            tableName: "agents";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        config: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "config";
            tableName: "agents";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        capabilities: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "capabilities";
            tableName: "agents";
            dataType: "json";
            columnType: "PgJsonb";
            data: string[];
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: string[];
        }>;
        provider: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "provider";
            tableName: "agents";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 100;
        }>;
        userId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "user_id";
            tableName: "agents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        profile: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "profile";
            tableName: "agents";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                about?: string;
                personality?: string;
                avatar?: string;
                emoji?: string;
                tags?: string[];
                creator?: string;
                version?: string;
                lastUpdated?: string;
            };
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                about?: string;
                personality?: string;
                avatar?: string;
                emoji?: string;
                tags?: string[];
                creator?: string;
                version?: string;
                lastUpdated?: string;
            };
        }>;
        createdAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "created_at";
            tableName: "agents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "updated_at";
            tableName: "agents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        deletedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "deleted_at";
            tableName: "agents";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
type Agent = typeof agents.$inferSelect;
interface AgentInsert {
    name: string;
    type: (typeof agents.$inferInsert)['type'];
    userId: string;
    status?: string | null;
    description?: string | null;
    systemPrompt?: string | null;
    config?: any;
    profile?: any;
    capabilities?: string[];
    provider?: string;
    deletedAt?: Date | null;
}
/**
 * Interface for the repository
 */
export interface IAgentRepository {
    create(data: AgentInsert): Promise<Agent>;
    findById(id: string): Promise<Agent | null>;
    findByUserId(userId: string): Promise<Agent[]>;
    findAll(filter?: Partial<Agent>): Promise<Agent[]>;
    findOne(filter: Partial<Agent>): Promise<Agent | null>;
    update(id: string, data: Partial<AgentInsert>): Promise<Agent | null>;
    delete(id: string): Promise<boolean>;
}
export declare class AgentRepository implements IAgentRepository {
    private readonly db;
    constructor(db: DrizzleClient);
    /**
     * Create a new agent
     */
    create(data: AgentInsert): Promise<Agent>;
    /**
     * Find agent by ID
     */
    findById(id: string): Promise<Agent | null>;
    /**
     * Find all agents for a user
     */
    findByUserId(userId: string): Promise<Agent[]>;
    /**
     * Find all agents with optional filter
     */
    findAll(filter?: Partial<Agent>): Promise<Agent[]>;
    /**
     * Find one agent matching filter
     */
    findOne(filter: Partial<Agent>): Promise<Agent | null>;
    /**
     * Update an agent
     */
    update(id: string, data: Partial<AgentInsert>): Promise<Agent | null>;
    /**
     * Soft delete an agent
     */
    delete(id: string): Promise<boolean>;
    /**
     * Search agents by name or description
     */
    search(query: string, userId?: string): Promise<Agent[]>;
    /**
     * Count agents by status
     */
    countByStatus(): Promise<{
        status: string;
        count: number;
    }[]>;
    /**
     * Find agents with specific capability
     */
    findByCapability(capability: string, userId: string): Promise<Agent[]>;
    /**
     * Find active agents for a user
     */
    findActiveByUserId(userId: string): Promise<Agent[]>;
}
export type { Agent, AgentInsert as NewAgent };
//# sourceMappingURL=agent.repository.d.ts.map