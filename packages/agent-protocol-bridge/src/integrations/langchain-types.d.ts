/**
 * Langchain Integration Types
 *
 * Comprehensive type definitions for Langchain integration,
 * enabling the use of Langchain components (chains, agents, tools, memory)
 * within The New Fuse AI Agent framework.
 */
import { NamedEntity } from '../types/common-types';
export interface LangchainChain extends NamedEntity {
    type: string;
    config: Record<string, any>;
}
export interface LangchainAgent extends NamedEntity {
    type: string;
    llmConfig: Record<string, any>;
    tools: LangchainTool[];
    memoryConfig?: Record<string, any>;
}
export interface LangchainTool extends NamedEntity {
    parameters?: Record<string, any>;
}
export interface LangchainMemory extends BaseEntity {
    type: string;
    config: Record<string, any>;
}
export interface LangchainExecuteChainRequest {
    chainId: string;
    input: Record<string, any>;
    callbacks?: string[];
}
export interface LangchainExecuteChainResponse {
    success: boolean;
    output?: Record<string, any>;
    error?: string;
}
export interface LangchainRunAgentRequest {
    agentId: string;
    input: string;
    callbacks?: string[];
}
export interface LangchainRunAgentResponse {
    success: boolean;
    output?: string;
    error?: string;
}
export interface LangchainUseToolRequest {
    toolId: string;
    input: Record<string, any>;
}
export interface LangchainUseToolResponse {
    success: boolean;
    output?: Record<string, any>;
    error?: string;
}
export interface LangchainBridgeConfig {
    enabled: boolean;
    defaultLLM?: string;
    defaultMemory?: string;
    availableTools?: string[];
}
export interface LangchainBridge {
    executeChain(request: LangchainExecuteChainRequest): Promise<LangchainExecuteChainResponse>;
    runAgent(request: LangchainRunAgentRequest): Promise<LangchainRunAgentResponse>;
    useTool(request: LangchainUseToolRequest): Promise<LangchainUseToolResponse>;
}
//# sourceMappingURL=langchain-types.d.ts.map