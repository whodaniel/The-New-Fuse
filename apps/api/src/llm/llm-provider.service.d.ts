import { LLMRegistry } from '@/llm/LLMRegistry';
import { DatabaseService } from '@/services/database';
export interface LLMProviderDTO {
    id: string;
    name: string;
    provider: string;
    modelName: string;
    isDefault?: boolean;
    isCustom?: boolean;
    apiEndpoint?: string;
}
export interface CreateLLMProviderDTO {
    name: string;
    provider: string;
    modelName: string;
    apiKey: string;
    apiEndpoint?: string;
}
export declare class LLMProviderService {
    private readonly llmRegistry;
    private readonly db;
    private logger;
    constructor(llmRegistry: LLMRegistry, db: DatabaseService);
    findAll(): Promise<LLMProviderDTO[]>;
    create(dto: CreateLLMProviderDTO): Promise<LLMProviderDTO>;
    findById(id: string): Promise<LLMProviderDTO>;
    update(id: string, dto: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO>;
    delete(id: string): Promise<void>;
    setDefault(id: string): Promise<LLMProviderDTO>;
}
