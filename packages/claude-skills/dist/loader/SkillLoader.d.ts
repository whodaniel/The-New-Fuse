/**
 * Skill Loader
 *
 * Loads skills from Anthropic's skills repository
 */
import type { ClaudeSkill, SkillImportResult, SkillLoaderConfig } from '../types/index.js';
/**
 * Skill loader class
 */
export declare class SkillLoader {
    private config;
    private parser;
    private updateTimer?;
    constructor(config?: Partial<SkillLoaderConfig>);
    /**
     * Initialize the loader by cloning/updating the repository
     */
    initialize(): Promise<void>;
    /**
     * Load all skills from the repository
     */
    loadAllSkills(): Promise<SkillImportResult>;
    /**
     * Load specific skills by name
     */
    loadSkillsByName(skillNames: string[]): Promise<SkillImportResult>;
    /**
     * Load a single skill by name
     */
    loadSkill(skillName: string): Promise<ClaudeSkill | null>;
    /**
     * Get list of available skill names
     */
    listAvailableSkills(): Promise<string[]>;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
    private repositoryExists;
    private cloneRepository;
    private updateRepository;
    private loadSkillsFromDirectory;
    private filterSkills;
    private setupAutoUpdate;
}
//# sourceMappingURL=SkillLoader.d.ts.map