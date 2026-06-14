/**
 * MCP Skill Provider
 *
 * Integrates Claude skills with The New Fuse MCP server
 */
import type { SkillExecutor } from '../executor/index.js';
import type { SkillRegistry } from '../registry/index.js';
import type { SkillMCPTool } from '../types/index.js';
/**
 * MCP Skill Provider
 * Exposes skills as MCP resources and tools
 */
export declare class MCPSkillProvider {
    private registry;
    private executor;
    constructor(registry: SkillRegistry, executor: SkillExecutor);
    /**
     * Get all skills as MCP resources
     */
    getSkillResources(): Promise<Array<{
        uri: string;
        name: string;
        description: string;
        mimeType: string;
    }>>;
    /**
     * Get skill content by URI
     */
    getSkillContent(uri: string): Promise<string | null>;
    /**
     * Get all skills as MCP tools
     */
    getSkillTools(): Promise<SkillMCPTool[]>;
    /**
     * Execute a skill as an MCP tool
     */
    executeSkillTool(toolName: string, parameters: Record<string, any>): Promise<any>;
    /**
     * Search skills and return as resources
     */
    searchSkills(query: string): Promise<Array<{
        uri: string;
        name: string;
        description: string;
        relevance: number;
    }>>;
    /**
     * Get skills by category as a resource collection
     */
    getSkillsByCategory(category: string): Promise<Array<{
        uri: string;
        name: string;
        description: string;
    }>>;
    /**
     * Get available categories
     */
    getCategories(): Promise<string[]>;
    /**
     * Get available tags
     */
    getTags(): Promise<string[]>;
    /**
     * Convert a skill to an MCP tool definition
     */
    private skillToMCPTool;
    /**
     * Format skill content for MCP resource
     */
    private formatSkillContent;
    /**
     * Calculate relevance score for search results
     */
    private calculateRelevance;
}
//# sourceMappingURL=MCPSkillProvider.d.ts.map