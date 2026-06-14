"use strict";
/**
 * MCP Skill Provider
 *
 * Integrates Claude skills with The New Fuse MCP server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPSkillProvider = void 0;
/**
 * MCP Skill Provider
 * Exposes skills as MCP resources and tools
 */
class MCPSkillProvider {
    constructor(registry, executor) {
        this.registry = registry;
        this.executor = executor;
    }
    /**
     * Get all skills as MCP resources
     */
    async getSkillResources() {
        const skills = await this.registry.list();
        return skills.map((skill) => ({
            uri: `skill://${skill.id}`,
            name: skill.name,
            description: skill.description,
            mimeType: 'text/markdown',
        }));
    }
    /**
     * Get skill content by URI
     */
    async getSkillContent(uri) {
        // Extract skill ID from URI (format: skill://skillId)
        const skillId = uri.replace('skill://', '');
        const skill = await this.registry.get(skillId);
        if (!skill) {
            return null;
        }
        // Return the full skill content including metadata
        return this.formatSkillContent(skill);
    }
    /**
     * Get all skills as MCP tools
     */
    async getSkillTools() {
        const skills = await this.registry.list();
        return skills.map((skill) => this.skillToMCPTool(skill));
    }
    /**
     * Execute a skill as an MCP tool
     */
    async executeSkillTool(toolName, parameters) {
        // Extract skill ID from tool name (format: skill_skillName)
        const skillName = toolName.replace('skill_', '').replace(/_/g, '-');
        // Find skill by name
        const skills = await this.registry.list();
        const skill = skills.find((s) => s.name === skillName);
        if (!skill) {
            throw new Error(`Skill ${skillName} not found`);
        }
        // Execute the skill
        const result = await this.executor.execute({
            skillId: skill.id,
            parameters,
        });
        if (!result.success) {
            throw new Error(result.error?.message || 'Skill execution failed');
        }
        return result.output;
    }
    /**
     * Search skills and return as resources
     */
    async searchSkills(query) {
        const skills = await this.registry.search(query);
        return skills.map((skill) => ({
            uri: `skill://${skill.id}`,
            name: skill.name,
            description: skill.description,
            relevance: this.calculateRelevance(skill, query),
        }));
    }
    /**
     * Get skills by category as a resource collection
     */
    async getSkillsByCategory(category) {
        const skills = await this.registry.getByCategory(category);
        return skills.map((skill) => ({
            uri: `skill://${skill.id}`,
            name: skill.name,
            description: skill.description,
        }));
    }
    /**
     * Get available categories
     */
    async getCategories() {
        return this.registry.getCategories();
    }
    /**
     * Get available tags
     */
    async getTags() {
        return this.registry.getTags();
    }
    // Private helper methods
    /**
     * Convert a skill to an MCP tool definition
     */
    skillToMCPTool(skill) {
        // Build input schema from skill parameters
        const properties = {};
        const required = [];
        for (const param of skill.parameters) {
            properties[param.name] = {
                type: param.type,
                description: param.description,
            };
            if (param.enum) {
                properties[param.name].enum = param.enum;
            }
            if (param.default !== undefined) {
                properties[param.name].default = param.default;
            }
            if (param.required) {
                required.push(param.name);
            }
        }
        // Convert skill name to tool name (replace hyphens with underscores)
        const toolName = `skill_${skill.name.replace(/-/g, '_')}`;
        return {
            name: toolName,
            description: skill.description,
            inputSchema: {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined,
            },
        };
    }
    /**
     * Format skill content for MCP resource
     */
    formatSkillContent(skill) {
        const sections = [
            `# ${skill.name}`,
            '',
            `**Category:** ${skill.category}`,
            `**Tags:** ${skill.tags.join(', ')}`,
            '',
            '## Description',
            skill.description,
            '',
            '## Instructions',
            skill.instructions,
            '',
        ];
        if (skill.metadata.allowedTools && skill.metadata.allowedTools.length > 0) {
            sections.push('## Allowed Tools');
            sections.push(skill.metadata.allowedTools.map((tool) => `- ${tool}`).join('\n'));
            sections.push('');
        }
        if (skill.metadata.license) {
            sections.push('## License');
            sections.push(skill.metadata.license);
            sections.push('');
        }
        return sections.join('\n');
    }
    /**
     * Calculate relevance score for search results
     */
    calculateRelevance(skill, query) {
        const queryLower = query.toLowerCase();
        let score = 0;
        // Exact match in name (highest weight)
        if (skill.name.toLowerCase() === queryLower) {
            score += 100;
        }
        else if (skill.name.toLowerCase().includes(queryLower)) {
            score += 50;
        }
        // Match in description
        if (skill.description.toLowerCase().includes(queryLower)) {
            score += 30;
        }
        // Match in tags
        const matchingTags = skill.tags.filter((tag) => tag.toLowerCase().includes(queryLower));
        score += matchingTags.length * 20;
        // Match in category
        if (skill.category.toLowerCase().includes(queryLower)) {
            score += 10;
        }
        return score;
    }
}
exports.MCPSkillProvider = MCPSkillProvider;
//# sourceMappingURL=MCPSkillProvider.js.map