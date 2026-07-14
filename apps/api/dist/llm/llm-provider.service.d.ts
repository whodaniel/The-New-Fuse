import { DatabaseService } from '@the-new-fuse/database';
export interface LLMRegistry {
    registerProvider(id: string, config: any): Promise<void>;
    unregisterProvider(id: string): Promise<void>;
}
export declare const LLM_REGISTRY = "LLMRegistry";
export declare class InMemoryLLMRegistry implements LLMRegistry {
    private readonly providers;
    registerProvider(id: string, config: any): Promise<void>;
    unregisterProvider(id: string): Promise<void>;
    getProvider(id: string): Record<string, unknown> | undefined;
}
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
    private readonly logger;
    constructor(llmRegistry: LLMRegistry, db: DatabaseService);
    findAll(): Promise<LLMProviderDTO[]>;
    create(dto: CreateLLMProviderDTO): Promise<LLMProviderDTO>;
    findById(id: string): Promise<LLMProviderDTO>;
    update(id: string, dto: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO>;
    delete(id: string): Promise<void>;
    setDefault(id: string): Promise<LLMProviderDTO>;
    registerClaudeCodeCLI(): Promise<LLMProviderDTO | null>;
    registerGeminiCLI(): Promise<LLMProviderDTO | null>;
}
//# sourceMappingURL=llm-provider.service.d.ts.map