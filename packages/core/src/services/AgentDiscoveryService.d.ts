/**
 * Agent Discovery Service
 *
 * Discovers, parses, and loads all agents from the .claude/agents directory,
 * integrating with the existing agent registry infrastructure and Claude Agent SDK.
 *
 * This service bridges the gap between the documented agent registry system
 * and the runtime agent management, making all 111+ specialized agents available
 * to the framework.
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export interface AgentMetadata {
    name: string;
    displayName?: string;
    description: string;
    tools?: string[];
    color?: string;
    author?: string;
    version?: string;
    systemPrompt: string;
    filePath: string;
    tags?: {
        domain?: string[];
        capability?: string[];
        tools?: string[];
        complexity?: string[];
        workflowStage?: string[];
    };
    metadata?: {
        created?: string;
        updated?: string;
        usageCount?: number;
        effectivenessScore?: number;
        toolsRequired?: string[];
        relatedAgents?: string[];
    };
    searchableText?: string;
    searchKeywords?: string[];
}
export interface AgentSearchCriteria {
    text?: string;
    domain?: string[];
    capability?: string[];
    tools?: string[];
    complexity?: string[];
    workflowStage?: string[];
    limit?: number;
    offset?: number;
}
export interface AgentSearchResult {
    agents: AgentMetadata[];
    total: number;
    page: number;
    pageSize: number;
}
export interface AgentTaxonomy {
    version: string;
    domains: Record<string, any>;
    capabilities: Record<string, any>;
    toolCategories: Record<string, any>;
    complexityLevels: Record<string, any>;
    workflowStages: Record<string, any>;
}
/**
 * Agent Discovery Service
 *
 * Loads and manages all agents from .claude/agents directory
 */
export declare class AgentDiscoveryService extends EventEmitter implements OnModuleInit {
    private readonly logger;
    private readonly agents;
    private readonly agentsDirectory;
    private taxonomy;
    private searchIndex;
    private isInitialized;
    constructor(agentsDirectory?: string);
    onModuleInit(): Promise<void>;
    /**
     * Parse an individual agent definition file
     */
    private parseAgentFile;
    /**
     * Generate searchable text from agent metadata
     */
    private generateSearchableText;
    /**
     * Extract keywords for search
     */
    private extractKeywords;
    /**
     * Check if word is a stop word
     */
    private isStopWord;
    /**
     * Search agents by criteria
     */
    searchAgents(criteria: AgentSearchCriteria): AgentSearchResult;
    /**
     * Get agent by name
     */
    getAgent(name: string): AgentMetadata | undefined;
    /**
     * List all agents
     */
    listAgents(): AgentMetadata[];
    /**
     * Get agents by domain
     */
    getAgentsByDomain(domain: string): AgentMetadata[];
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability: string): AgentMetadata[];
    /**
     * Get taxonomy
     */
    getTaxonomy(): AgentTaxonomy | null;
    /**
     * Get search index
     */
    getSearchIndex(): any;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalAgents: number;
        byDomain: Record<string, number>;
        byCapability: Record<string, number>;
        byComplexity: Record<string, number>;
        isInitialized: boolean;
    };
    /**
     * Get default taxonomy
     */
    private getDefaultTaxonomy;
    /**
     * Get default search index
     */
    private getDefaultSearchIndex;
    /**
     * Reload agents from disk
     */
    reload(): Promise<void>;
}
//# sourceMappingURL=AgentDiscoveryService.d.ts.map