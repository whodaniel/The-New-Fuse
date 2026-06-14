/**
 * Skill Parser
 *
 * Parses SKILL.md files with YAML frontmatter and markdown content
 */
import type { ClaudeSkill } from '../types/index.js';
/**
 * Skill parser class
 */
export declare class SkillParser {
    /**
     * Parse a SKILL.md file and return a ClaudeSkill object
     */
    parseSkillFile(filePath: string): Promise<ClaudeSkill>;
    /**
     * Parse multiple SKILL.md files from a directory
     */
    parseSkillDirectory(directoryPath: string): Promise<ClaudeSkill[]>;
    /**
     * Generate a unique skill ID from the skill name
     */
    private generateSkillId;
    /**
     * Infer skill category from file path and content
     */
    private inferCategory;
    /**
     * Extract tags from file path and content
     */
    private extractTags;
    /**
     * Extract instructions from markdown content
     * Returns the main instructional content, excluding frontmatter
     */
    private extractInstructions;
    /**
     * Extract parameters from skill content
     * This is a basic implementation - can be enhanced based on skill conventions
     */
    private extractParameters;
    /**
     * Validate a skill object
     */
    validateSkill(skill: ClaudeSkill): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=SkillParser.d.ts.map