export declare class PersonalSkillDto {
    id: string;
    userId: string;
    slug: string;
    name: string;
    description: string;
    instructions: string;
    tags: string[];
    metadata: Record<string, unknown>;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare class CreatePersonalSkillDto {
    name: string;
    description?: string;
    instructions: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    isPrivate?: boolean;
}
export declare class UpdatePersonalSkillDto {
    name?: string;
    description?: string;
    instructions?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    isPrivate?: boolean;
}
//# sourceMappingURL=personal-skill.dto.d.ts.map