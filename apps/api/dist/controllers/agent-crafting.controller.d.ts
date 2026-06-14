import { DatabaseService } from '@the-new-fuse/database';
export declare const TEMPERAMENTS: {
    TIGHT_AGGRESSIVE: string;
    LOOSE_AGGRESSIVE: string;
    TIGHT_PASSIVE: string;
    BALANCED: string;
};
export declare class AgentCraftingController {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    getTemplates(user: any): Promise<{
        id: string;
        name: string;
        description: string;
        minLevel: string;
    }[]>;
    craftAgent(workspaceId: string, body: {
        name: string;
        temperament: string;
        description?: string;
    }, user: any): Promise<{
        description: string | null;
        provider: string;
        name: string;
        type: "CONVERSATIONAL" | "IDE_EXTENSION" | "API" | "ORCHESTRATOR" | "BASIC" | "CHAT" | "WORKFLOW" | "TASK" | "ASSISTANT" | "ANALYSIS" | "BROKER" | "MONITOR" | "VALIDATOR" | "ROUTER" | "SCHEDULER" | "GATEWAY" | "CLI_CODER" | "CLI_DEBUGGER" | "CLI_DEVOPS" | "CLI_DATABASE" | "CLI_GIT" | "CLI_SHELL" | "IDE_VSCODE" | "IDE_CURSOR" | "IDE_WINDSURF" | "IDE_JETBRAINS" | "IDE_NEOVIM" | "IDE_EMACS" | "BROWSER_GEMINI" | "BROWSER_CLAUDE" | "BROWSER_CHATGPT" | "BROWSER_COPILOT" | "BROWSER_PERPLEXITY" | "BROWSER_PHIND" | "GITHUB_JULES" | "GITHUB_COPILOT" | "GITHUB_ACTIONS" | "GITHUB_CODESPACES" | "CODE_GENERATOR" | "CODE_REVIEWER" | "CODE_REFACTORER" | "CODE_DOCUMENTER" | "CODE_TESTER" | "CODE_ARCHITECT" | "CODE_OPTIMIZER" | "CODE_SECURITY" | "CODE_MIGRATOR" | "CODE_TRANSLATOR" | "DATA_ANALYST" | "DATA_ENGINEER" | "DATA_SCIENTIST" | "DATA_VISUALIZER" | "DATA_CLEANER" | "DATA_VALIDATOR" | "INFRA_DEVOPS" | "INFRA_CLOUD" | "INFRA_KUBERNETES" | "INFRA_DOCKER" | "INFRA_TERRAFORM" | "INFRA_MONITORING" | "DOC_WRITER" | "DOC_API" | "DOC_README" | "DOC_CHANGELOG" | "DOC_TUTORIAL" | "TEST_UNIT" | "TEST_INTEGRATION" | "TEST_E2E" | "TEST_PERFORMANCE" | "TEST_SECURITY" | "TEST_ACCESSIBILITY" | "AI_TRAINER" | "AI_EVALUATOR" | "AI_PROMPT_ENGINEER" | "AI_RAG" | "AI_EMBEDDINGS" | "AI_FINE_TUNER" | "COMM_TRANSLATOR" | "COMM_SUMMARIZER" | "COMM_WRITER" | "COMM_EMAIL" | "COMM_SLACK" | "COMM_DISCORD" | "RESEARCH_WEB" | "RESEARCH_ACADEMIC" | "RESEARCH_MARKET" | "RESEARCH_COMPETITOR" | "DOMAIN_LEGAL" | "DOMAIN_FINANCE" | "DOMAIN_HEALTHCARE" | "DOMAIN_EDUCATION" | "DOMAIN_ECOMMERCE" | "DOMAIN_GAMING" | "TNF_CORE" | "TNF_ONBOARDING" | "TNF_COORDINATOR" | "TNF_HANDOFF" | "TNF_HEARTBEAT" | "TNF_CLEANUP";
        capabilities: string[];
        config: unknown;
        systemPrompt: string | null;
        profile: {
            about?: string;
            personality?: string;
            avatar?: string;
            emoji?: string;
            tags?: string[];
            creator?: string;
            version?: string;
            lastUpdated?: string;
        } | null;
        status: "ACTIVE" | "INACTIVE" | "IDLE" | "BUSY" | "ERROR" | "OFFLINE" | "INITIALIZING" | "READY" | "TERMINATED";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    initializeNurture(agentId: string, body: {
        workspaceId: string;
    }, user: any): Promise<{
        description: string | null;
        provider: string;
        name: string;
        type: "CONVERSATIONAL" | "IDE_EXTENSION" | "API" | "ORCHESTRATOR" | "BASIC" | "CHAT" | "WORKFLOW" | "TASK" | "ASSISTANT" | "ANALYSIS" | "BROKER" | "MONITOR" | "VALIDATOR" | "ROUTER" | "SCHEDULER" | "GATEWAY" | "CLI_CODER" | "CLI_DEBUGGER" | "CLI_DEVOPS" | "CLI_DATABASE" | "CLI_GIT" | "CLI_SHELL" | "IDE_VSCODE" | "IDE_CURSOR" | "IDE_WINDSURF" | "IDE_JETBRAINS" | "IDE_NEOVIM" | "IDE_EMACS" | "BROWSER_GEMINI" | "BROWSER_CLAUDE" | "BROWSER_CHATGPT" | "BROWSER_COPILOT" | "BROWSER_PERPLEXITY" | "BROWSER_PHIND" | "GITHUB_JULES" | "GITHUB_COPILOT" | "GITHUB_ACTIONS" | "GITHUB_CODESPACES" | "CODE_GENERATOR" | "CODE_REVIEWER" | "CODE_REFACTORER" | "CODE_DOCUMENTER" | "CODE_TESTER" | "CODE_ARCHITECT" | "CODE_OPTIMIZER" | "CODE_SECURITY" | "CODE_MIGRATOR" | "CODE_TRANSLATOR" | "DATA_ANALYST" | "DATA_ENGINEER" | "DATA_SCIENTIST" | "DATA_VISUALIZER" | "DATA_CLEANER" | "DATA_VALIDATOR" | "INFRA_DEVOPS" | "INFRA_CLOUD" | "INFRA_KUBERNETES" | "INFRA_DOCKER" | "INFRA_TERRAFORM" | "INFRA_MONITORING" | "DOC_WRITER" | "DOC_API" | "DOC_README" | "DOC_CHANGELOG" | "DOC_TUTORIAL" | "TEST_UNIT" | "TEST_INTEGRATION" | "TEST_E2E" | "TEST_PERFORMANCE" | "TEST_SECURITY" | "TEST_ACCESSIBILITY" | "AI_TRAINER" | "AI_EVALUATOR" | "AI_PROMPT_ENGINEER" | "AI_RAG" | "AI_EMBEDDINGS" | "AI_FINE_TUNER" | "COMM_TRANSLATOR" | "COMM_SUMMARIZER" | "COMM_WRITER" | "COMM_EMAIL" | "COMM_SLACK" | "COMM_DISCORD" | "RESEARCH_WEB" | "RESEARCH_ACADEMIC" | "RESEARCH_MARKET" | "RESEARCH_COMPETITOR" | "DOMAIN_LEGAL" | "DOMAIN_FINANCE" | "DOMAIN_HEALTHCARE" | "DOMAIN_EDUCATION" | "DOMAIN_ECOMMERCE" | "DOMAIN_GAMING" | "TNF_CORE" | "TNF_ONBOARDING" | "TNF_COORDINATOR" | "TNF_HANDOFF" | "TNF_HEARTBEAT" | "TNF_CLEANUP";
        capabilities: string[];
        config: unknown;
        systemPrompt: string | null;
        profile: {
            about?: string;
            personality?: string;
            avatar?: string;
            emoji?: string;
            tags?: string[];
            creator?: string;
            version?: string;
            lastUpdated?: string;
        } | null;
        status: "ACTIVE" | "INACTIVE" | "IDLE" | "BUSY" | "ERROR" | "OFFLINE" | "INITIALIZING" | "READY" | "TERMINATED";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    private assertWorkspaceAccess;
}
//# sourceMappingURL=agent-crafting.controller.d.ts.map