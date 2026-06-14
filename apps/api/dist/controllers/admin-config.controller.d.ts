import { ConfigService } from '@nestjs/config';
import { AuditService } from '../services/audit.service';
interface ConfigItem {
    key: string;
    value: string;
    category: string;
    description: string;
    sensitive: boolean;
    updatedAt: Date;
    updatedBy: string;
}
interface LLMRoutingSelection {
    provider: string;
    model: string;
}
interface LLMRoutingAgentConfig {
    primary: LLMRoutingSelection;
    fallback: LLMRoutingSelection;
    enabled: boolean;
}
interface LLMRoutingConfig {
    version: number;
    updatedAt: string;
    global: {
        primary: LLMRoutingSelection;
        fallback: LLMRoutingSelection;
    };
    agents: Record<string, LLMRoutingAgentConfig>;
}
interface LLMRoutingOptions {
    providers: Array<{
        provider: string;
        models: string[];
    }>;
    targets: string[];
}
/**
 * Admin Configuration Controller
 *
 * Manages system configuration and environment variables.
 * All endpoints require SUPER_ADMIN access.
 * Sensitive values are always masked in responses.
 */
export declare class AdminConfigController {
    private readonly configService;
    private readonly auditService;
    constructor(configService: ConfigService, auditService: AuditService);
    /**
     * Get all configuration items (with sensitive values masked)
     */
    getAllConfig(): Promise<ConfigItem[]>;
    /**
     * Get configuration item by key (sensitive values masked)
     */
    getConfigByKey(key: string): Promise<ConfigItem>;
    /**
     * Update configuration item
     * WARNING: This is a dangerous operation that modifies environment variables
     */
    updateConfig(key: string, updateData: {
        value: string;
    }): Promise<ConfigItem>;
    getLlmRoutingOptions(): Promise<LLMRoutingOptions>;
    getLlmRoutingConfig(): Promise<LLMRoutingConfig>;
    updateLlmRoutingConfig(payload: Partial<LLMRoutingConfig>): Promise<LLMRoutingConfig>;
    getEffectiveLlmRouting(target: string): Promise<{
        target: string;
        source: 'global' | 'agent-override';
        primary: LLMRoutingSelection;
        fallback: LLMRoutingSelection;
    }>;
    /**
     * Mask sensitive configuration values
     */
    private maskSensitiveValue;
    /**
     * Get category for a configuration key
     */
    private getCategoryForKey;
    private defaultLlmRoutingConfig;
    private normalizeLlmRoutingConfig;
    private normalizeSelection;
}
export {};
//# sourceMappingURL=admin-config.controller.d.ts.map