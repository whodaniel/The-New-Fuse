/**
 * Skill Executor
 *
 * Executes Claude skills with parameter validation and error handling
 */
import type { ClaudeSkill, ISkillExecutor, SkillExecutionContext, SkillExecutionResult, ValidationResult } from '../types/index.js';
/**
 * Skill executor class
 */
export declare class SkillExecutor implements ISkillExecutor {
    private skills;
    constructor();
    /**
     * Register a skill for execution
     */
    registerSkill(skill: ClaudeSkill): void;
    /**
     * Unregister a skill
     */
    unregisterSkill(skillId: string): void;
    /**
     * Get a registered skill
     */
    getSkill(skillId: string): ClaudeSkill | undefined;
    /**
     * Execute a skill with the given context
     */
    execute(context: SkillExecutionContext): Promise<SkillExecutionResult>;
    /**
     * Validate skill parameters
     */
    validate(skillId: string, parameters: Record<string, any>): Promise<ValidationResult>;
    /**
     * Validate parameter type
     */
    private validateParameterType;
    /**
     * Get execution statistics
     */
    getStatistics(): {
        totalSkills: number;
        skillsByCategory: Record<string, number>;
    };
    /**
     * List all registered skills
     */
    listSkills(): ClaudeSkill[];
    /**
     * Clear all registered skills
     */
    clear(): void;
}
//# sourceMappingURL=SkillExecutor.d.ts.map