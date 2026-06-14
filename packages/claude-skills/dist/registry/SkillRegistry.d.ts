/**
 * Skill Registry
 *
 * Manages Claude skills and integrates with The New Fuse resource registry
 */
import type { ClaudeSkill, ISkillRegistry, SkillFilter } from '../types/index.js';
/**
 * In-memory skill registry implementation
 */
export declare class SkillRegistry implements ISkillRegistry {
    private skills;
    private skillsByCategory;
    private skillsByTag;
    constructor();
    /**
     * Register a skill
     */
    register(skill: ClaudeSkill): Promise<void>;
    /**
     * Unregister a skill
     */
    unregister(skillId: string): Promise<void>;
    /**
     * Get a skill by ID
     */
    get(skillId: string): Promise<ClaudeSkill | undefined>;
    /**
     * List skills with optional filtering
     */
    list(filter?: SkillFilter): Promise<ClaudeSkill[]>;
    /**
     * Search skills by query
     */
    search(query: string): Promise<ClaudeSkill[]>;
    /**
     * Update a skill
     */
    update(skillId: string, updates: Partial<ClaudeSkill>): Promise<void>;
    /**
     * Get all categories
     */
    getCategories(): string[];
    /**
     * Get all tags
     */
    getTags(): string[];
    /**
     * Get skills by category
     */
    getByCategory(category: string): Promise<ClaudeSkill[]>;
    /**
     * Get skills by tag
     */
    getByTag(tag: string): Promise<ClaudeSkill[]>;
    /**
     * Get registry statistics
     */
    getStatistics(): {
        totalSkills: number;
        categoriesCount: number;
        tagsCount: number;
        skillsByCategory: Record<string, number>;
    };
    /**
     * Clear all skills
     */
    clear(): void;
    /**
     * Get total count
     */
    count(): number;
    /**
     * Check if skill exists
     */
    has(skillId: string): boolean;
}
//# sourceMappingURL=SkillRegistry.d.ts.map