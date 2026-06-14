import { z } from 'zod';
export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    triggerPhrases: string[];
    handler: string;
    parameters: Record<string, {
        type: string;
        description: string;
        required: boolean;
    }>;
}
export declare const SkillLoadingInputSchema: z.ZodObject<{
    skillName: z.ZodString;
    agentId: z.ZodString;
}, z.core.$strip>;
export type SkillLoadingInput = z.infer<typeof SkillLoadingInputSchema>;
export declare class SkillLoader {
    private registry;
    private loadedSkills;
    register(skill: SkillDefinition): void;
    loadSkill(input: SkillLoadingInput): Promise<{
        loaded: boolean;
        skill?: SkillDefinition;
        error?: string;
    }>;
    getLoadedSkills(agentId: string): SkillDefinition[];
    isLoaded(agentId: string, skillName: string): boolean;
    listAvailable(): Array<{
        id: string;
        name: string;
        description: string;
    }>;
}
//# sourceMappingURL=skillLoader.d.ts.map