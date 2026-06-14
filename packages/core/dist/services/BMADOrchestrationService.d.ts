/**
 * BMAD Orchestration Service
 *
 * Implements the BMAD (Breakthrough Method for Agile AI-Driven Development) framework.
 * This service orchestrates the four layers in proper chronological order:
 *
 * 1. SKILLS COMPOSITION - Load and compose Claude Skills
 * 2. TOOL CREATION - Create tools from skills for agent use
 * 3. CONTEXT ENGINEERING - Build optimal context for LLM prompts
 * 4. PROMPT ENGINEERING - Template and execute prompts
 *
 * CONNECTS TO (no duplication, reuses existing services):
 * - ClaudeSkillsManager: For skill loading and execution
 * - PromptTemplateService: For prompt management
 * - DirectorService: For autonomous loop integration
 * - AgentSwarmOrchestrationService: For agent coordination
 * - CascadeBridge: For workflow execution
 */
import { EventEmitter } from 'events';
export interface SkillComposition {
    id: string;
    name: string;
    description: string;
    baseSkills: string[];
    compositionType: 'sequential' | 'parallel' | 'conditional' | 'fallback';
    conditions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface ComposedSkill {
    compositionId: string;
    skills: Array<{
        skillId: string;
        order: number;
        required: boolean;
    }>;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
}
export interface AgentTool {
    id: string;
    name: string;
    description: string;
    skillId?: string;
    compositionId?: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    permissions?: string[];
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
    };
}
export interface ToolExecutionResult {
    toolId: string;
    success: boolean;
    output?: unknown;
    error?: string;
    durationMs: number;
    tokensUsed?: number;
}
export interface ContextSource {
    id: string;
    type: 'document' | 'code' | 'conversation' | 'memory' | 'tool_output' | 'handoff';
    priority: number;
    content: string;
    tokenEstimate?: number;
    metadata?: {
        path?: string;
        language?: string;
        timestamp?: Date;
        relevanceScore?: number;
    };
}
export interface EngineeredContext {
    id: string;
    sources: ContextSource[];
    totalTokens: number;
    maxTokens: number;
    windowUtilization: number;
    compiledContext: string;
    metadata: {
        createdAt: Date;
        expiresAt?: Date;
        purpose: string;
        agentId?: string;
    };
}
export interface PromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: string[];
    contextRequirements?: string[];
    toolRequirements?: string[];
    version: string;
    metadata?: Record<string, unknown>;
}
export interface PromptExecution {
    templateId: string;
    context: EngineeredContext;
    variables: Record<string, unknown>;
    result?: string;
    tokensInput?: number;
    tokensOutput?: number;
    durationMs?: number;
}
export interface BMADConfig {
    maxContextTokens: number;
    contextBufferPercent: number;
    defaultSkillTimeout: number;
    enableCaching: boolean;
    cacheExpiryMs: number;
}
export declare class BMADOrchestrationService extends EventEmitter {
    private config;
    private skills;
    private compositions;
    private tools;
    private contextSources;
    private activeContext;
    private templates;
    private executionHistory;
    constructor(config?: Partial<BMADConfig>);
    /**
     * Register a skill from ClaudeSkillsManager
     */
    registerSkill(skillId: string, skill: unknown): void;
    /**
     * Create a composition of multiple skills
     */
    createComposition(composition: Omit<SkillComposition, 'id'>): SkillComposition;
    /**
     * Get composed skill ready for execution
     */
    composeSkills(compositionId: string, inputs: Record<string, unknown>): Promise<ComposedSkill>;
    /**
     * Create a tool from a skill or composition
     */
    createTool(tool: Omit<AgentTool, 'id'>): AgentTool;
    /**
     * Create tools from all registered skills
     */
    createToolsFromSkills(): AgentTool[];
    /**
     * Execute a tool
     */
    executeTool(toolId: string, inputs: Record<string, unknown>): Promise<ToolExecutionResult>;
    private executeSkill;
    /**
     * Get available tools
     */
    getTools(): AgentTool[];
    /**
     * Add a context source
     */
    addContextSource(source: Omit<ContextSource, 'id'>): ContextSource;
    /**
     * Engineer context for a specific purpose
     */
    engineerContext(purpose: string, requirements?: {
        requiredTypes?: ContextSource['type'][];
        maxTokens?: number;
        agentId?: string;
    }): EngineeredContext;
    /**
     * Compile context sources into a single string
     */
    private compileContext;
    /**
     * Estimate token count for text
     */
    private estimateTokens;
    /**
     * Clear context sources
     */
    clearContext(): void;
    /**
     * Register a prompt template
     */
    registerTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate;
    /**
     * Compile a prompt with context and variables
     */
    compilePrompt(templateId: string, variables: Record<string, unknown>): string;
    /**
     * Execute a full prompt cycle
     */
    executePrompt(templateId: string, variables: Record<string, unknown>, context?: EngineeredContext): Promise<PromptExecution>;
    /**
     * Initialize default prompt templates
     */
    private initializeDefaultTemplates;
    /**
     * Execute a complete BMAD cycle
     * This is the main orchestration method that follows the proper order
     */
    executeBMADCycle(config: {
        skillIds?: string[];
        contextPurpose: string;
        templateId: string;
        variables: Record<string, unknown>;
        agentId?: string;
    }): Promise<{
        skills: string[];
        tools: AgentTool[];
        context: EngineeredContext;
        execution: PromptExecution;
    }>;
    /**
     * Get orchestration statistics
     */
    getStatistics(): {
        skills: number;
        compositions: number;
        tools: number;
        contextSources: number;
        templates: number;
        executions: number;
        activeContextTokens: number;
    };
}
export default BMADOrchestrationService;
//# sourceMappingURL=BMADOrchestrationService.d.ts.map