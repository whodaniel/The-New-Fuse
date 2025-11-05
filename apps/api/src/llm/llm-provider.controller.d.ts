import { LLMProviderService, CreateLLMProviderDTO, LLMProviderDTO } from './llm-provider.service';
export declare class LLMProviderController {
    private readonly llmProviderService;
    constructor(llmProviderService: LLMProviderService);
    findAll(): Promise<LLMProviderDTO[]>;
    create(createLLMProviderDto: CreateLLMProviderDTO): Promise<LLMProviderDTO>;
    findOne(id: string): Promise<LLMProviderDTO>;
    update(id: string, updateLLMProviderDto: Partial<CreateLLMProviderDTO>): Promise<LLMProviderDTO>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    setDefault(id: string): Promise<LLMProviderDTO>;
    registerClaudeCodeCLI(): Promise<{
        success: boolean;
        provider?: LLMProviderDTO;
        message: string;
    }>;
    registerGeminiCLI(): Promise<{
        success: boolean;
        provider?: LLMProviderDTO;
        message: string;
    }>;
    registerOllama(): Promise<{
        success: boolean;
        provider?: LLMProviderDTO;
        message: string;
    }>;
}
//# sourceMappingURL=llm-provider.controller.d.ts.map