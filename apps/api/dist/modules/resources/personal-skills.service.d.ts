import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { CreatePersonalSkillDto, UpdatePersonalSkillDto } from './dto/personal-skill.dto';
export type PersonalSkillRecord = {
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
};
export declare class PersonalSkillsService {
    private readonly db;
    private initialized;
    private initializePromise;
    constructor(db: DatabaseService);
    listByUser(userId: string): Promise<PersonalSkillRecord[]>;
    getByUser(userId: string, skillId: string): Promise<PersonalSkillRecord>;
    createByUser(userId: string, input: CreatePersonalSkillDto): Promise<PersonalSkillRecord>;
    updateByUser(userId: string, skillId: string, input: UpdatePersonalSkillDto): Promise<PersonalSkillRecord>;
    deleteByUser(userId: string, skillId: string): Promise<void>;
    private ensureInitialized;
    private initializeSchema;
    private findOwnedSkill;
    private ensureUniqueSlug;
    private toRecord;
    private slugify;
    private normalizeRequiredText;
    private normalizeOptionalText;
    private normalizeTags;
    private normalizeMetadata;
    private validateUuid;
}
//# sourceMappingURL=personal-skills.service.d.ts.map