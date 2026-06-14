import { LLMConfig, NewLLMConfig } from '../types/index.js';
export declare class DrizzleLLMConfigRepository {
    /**
     * Find all configs
     */
    findAll(): Promise<LLMConfig[]>;
    /**
     * Find enabled configs
     */
    findEnabled(): Promise<LLMConfig[]>;
    /**
     * Find config by ID
     */
    findById(id: string): Promise<LLMConfig | null>;
    /**
     * Create config
     */
    create(data: NewLLMConfig): Promise<LLMConfig>;
    /**
     * Update config
     */
    update(id: string, data: Partial<NewLLMConfig>): Promise<LLMConfig | null>;
    /**
     * Delete config
     */
    delete(id: string): Promise<boolean>;
    /**
     * Set config as default (priority 1) and others to 10
     */
    setDefault(id: string): Promise<LLMConfig | null>;
}
export declare const drizzleLLMConfigRepository: DrizzleLLMConfigRepository;
//# sourceMappingURL=llm_config.repository.d.ts.map