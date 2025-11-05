import { ConfigService } from '@nestjs/config';
import { AgentFactoryConfig } from '@the-new-fuse/types';
interface DACCAgentDefinition {
    id: string;
    name: string;
    description?: string;
    [key: string]: any;
}
interface POMExecutionContext {
    id: string;
    [key: string]: any;
}
export interface AgentInstance {
    id: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    config: Record<string, any>;
    daccDefinition?: DACCAgentDefinition;
    compiledSchema?: any;
}
export interface DACCAgentInstance extends AgentInstance {
    daccDefinition: DACCAgentDefinition;
    compiledSchema: any;
    execute: (input: any, context?: POMExecutionContext) => Promise<any>;
    parseOutput: (rawOutput: string) => Promise<any>;
}
export declare class AgentFactory {
    private configService;
    private readonly logger;
    private activeAgents;
    private compiledSchemaCache;
    private factoryConfig;
    constructor(configService: ConfigService);
    /**
     * Create agent from DACC definition
     */
    createDACCAgent(agentDefinition: DACCAgentDefinition): Promise<DACCAgentInstance>;
    /**
     * Legacy method for backward compatibility
     */
    createAgent(type: string, agentId: string, config: Record<string, any>): Promise<AgentInstance>;
    updateAgent(instanceId: string, config: Record<string, any>): Promise<void>;
    destroyAgent(instanceId: string): Promise<void>;
    getDefaultConfig(type: string): Record<string, any>;
    getActiveAgents(): AgentInstance[];
    getAgent(agentId: string): AgentInstance | undefined;
    /**
     * Get DACC agent instance
     */
    getDACCAgent(agentId: string): DACCAgentInstance | undefined;
    /**
     * Compile schema based on parsing strategy
     */
    private compileSchema;
    /**
     * Compile Lark grammar schema
     */
    private compileLarkSchema;
    /**
     * Compile Instructor schema (Pydantic-based)
     */
    private compileInstructorSchema;
    /**
     * Create execute function for DACC agent
     * Enhanced to support POML template rendering with execution context
     */
    private createExecuteFunction;
    /**
     * Create parse function for DACC agent
     */
    private createParseFunction;
    /**
     * Build prompt from agent definition and input
     * Enhanced to support POML templates (v2.0) with fallback to legacy format
     */
    private buildPrompt;
    /**
     * Render POML template with input data and execution context
     */
    private renderPOMLTemplate;
    /**
     * Gets a formatted list of available agents for prompt injection.
     * In a real implementation, this would fetch from the AgentsService.
     */
    private getAvailableAgents;
    /**
     * Extract POML metadata for hint-then-validate pattern
     */
    private extractPOMLMetadata;
    /**
     * Call LLM with the constructed prompt using hint-then-validate pattern
     */
    private callLLM;
    /**
     * Simulate LLM API call with POML hints (production would use real LLM provider)
     */
    private simulateLLMCall;
    /**
     * Parse output using compiled schema (VALIDATE phase of hint-then-validate pattern)
     */
    private parseWithSchema;
    /**
     * Parse with Lark grammar
     */
    private parseWithLark;
    /**
     * Parse with Instructor (structured output) - Enhanced for hint-then-validate
     */
    private parseWithInstructor;
    /**
     * Clear schema cache
     */
    clearSchemaCache(): void;
    /**
     * Get factory configuration
     */
    getFactoryConfig(): AgentFactoryConfig;
}
export {};
//# sourceMappingURL=agent.factory.d.ts.map