import { PastTaskResult, SemanticSkillDiscovery } from '../orchestration/types.js';
/**
 * Mock implementation of the SemanticSkillDiscovery service for development and testing.
 * In a real implementation, this would use NLP or other techniques to identify skills.
 */
export declare class SemanticSkillDiscoveryImpl implements SemanticSkillDiscovery {
    /**
     * Finds relevant skills by analyzing examples of past successful tasks.
     * @param examples - A list of successful past task results.
     * @returns A promise that resolves to a list of recommended skill names.
     */
    findSkillsByExample(examples: PastTaskResult[]): Promise<string[]>;
}
//# sourceMappingURL=SemanticSkillDiscovery.d.ts.map