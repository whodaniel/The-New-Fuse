/**
 * Claude Skills Manager
 *
 * Main orchestrator for Claude Skills integration
 */
import { SkillExecutor } from './executor/index.js';
import { MCPSkillProvider } from './integration/index.js';
import { SkillRegistry } from './registry/index.js';
import { ClaudeSkill, SkillExecutionContext, SkillExecutionResult, SkillFilter, SkillImportResult, SkillLoaderConfig } from './types/index.js';
/**
 * Configuration for Claude Skills Manager
 */
export interface ClaudeSkillsManagerConfig {
    loader?: Partial<SkillLoaderConfig>;
    autoInitialize?: boolean;
    prioritySkills?: string[];
}
/**
 * Main manager class for Claude Skills
 */
export declare class ClaudeSkillsManager {
    private loader;
    private parser;
    private executor;
    private registry;
    private mcpProvider;
    private initialized;
    constructor(config?: ClaudeSkillsManagerConfig);
    /**
     * Initialize the skills system
     */
    initialize(prioritySkills?: string[]): Promise<SkillImportResult>;
    /**
     * Load additional skills by name
     */
    loadSkills(skillNames: string[]): Promise<SkillImportResult>;
    /**
     * Reload all skills from repository
     */
    reloadSkills(): Promise<SkillImportResult>;
    /**
     * Execute a skill
     */
    executeSkill(context: SkillExecutionContext): Promise<SkillExecutionResult>;
    /**
     * Get a skill by ID
     */
    getSkill(skillId: string): Promise<ClaudeSkill | undefined>;
    /**
     * List skills with optional filtering
     */
    listSkills(filter?: SkillFilter): Promise<ClaudeSkill[]>;
    /**
     * Search skills
     */
    searchSkills(query: string): Promise<ClaudeSkill[]>;
    /**
     * Get skills by category
     */
    getSkillsByCategory(category: string): Promise<ClaudeSkill[]>;
    /**
     * Get skills by tag
     */
    getSkillsByTag(tag: string): Promise<ClaudeSkill[]>;
    /**
     * Get all categories
     */
    getCategories(): string[];
    /**
     * Get all tags
     */
    getTags(): string[];
    /**
     * Get statistics
     */
    getStatistics(): {
        registry: ReturnType<SkillRegistry['getStatistics']>;
        executor: ReturnType<SkillExecutor['getStatistics']>;
        initialized: boolean;
    };
    /**
     * Get MCP provider for integration
     */
    getMCPProvider(): MCPSkillProvider;
    /**
     * Get available skill names from repository
     */
    getAvailableSkillNames(): Promise<string[]>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * Check if manager is initialized
     */
    isInitialized(): boolean;
}
/**
 * Get the global Claude Skills Manager instance
 */
export declare function getClaudeSkillsManager(config?: ClaudeSkillsManagerConfig): ClaudeSkillsManager;
/**
 * Reset the global instance (useful for testing)
 */
export declare function resetClaudeSkillsManager(): void;
//# sourceMappingURL=ClaudeSkillsManager.d.ts.map