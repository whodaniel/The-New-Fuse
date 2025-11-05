import { PrismaService } from '@the-new-fuse/database';
export interface LLMRegistry {
    registerProvider(id: string, config: any): Promise<void>;
    unregisterProvider(id: string): Promise<void>;
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
    private readonly prisma;
    private logger;
    constructor(llmRegistry: LLMRegistry, prisma: PrismaService);
    findAll(): Promise<LLMProviderDTO[]>;
    create(dto: CreateLLMProviderDTO): Promise<LLMProviderDTO>;
    findById(id: string): Promise<LLMProviderDTO>;
    update(id: string, dto: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO>;
    delete(id: string): Promise<void>;
    setDefault(id: string): Promise<LLMProviderDTO>;
    registerClaudeCodeCLI(): Promise<LLMProviderDTO | null>;
    registerGeminiCLI(): Promise<LLMProviderDTO | null>;
    registerOllama(): Promise<LLMProviderDTO | null>;
}
//# sourceMappingURL=llm-provider.service.d.ts.map