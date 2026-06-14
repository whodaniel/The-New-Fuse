import { OnModuleInit } from '@nestjs/common';
export declare class BMADService implements OnModuleInit {
    private readonly logger;
    private skills;
    private tools;
    onModuleInit(): Promise<void>;
    private initializeDefaultSkills;
    registerSkill(id: string, skill: any): void;
    createToolFromSkill(skillId: string): any;
    executeBMADCycle(config: {
        skillIds: string[];
        contextPurpose: string;
        templateId: string;
        variables: Record<string, any>;
    }): Promise<{
        skills: number;
        tools: number;
        contextTokens: number;
        success: boolean;
    }>;
    getStatistics(): {
        skills: number;
        tools: number;
    };
}
//# sourceMappingURL=bmad.service.d.ts.map