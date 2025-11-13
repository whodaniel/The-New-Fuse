/**
 * LLM Provider Configuration Service
 *
 * Centralized configuration management for all LLM providers across The New Fuse framework.
 * Handles provider discovery, configuration validation, and dynamic updates.
 *
 * @module LLMProviderConfigurationService
 * @since 2025-10-06
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface ProviderDiscoveryResult {
    id: string;
    name: string;
    type: 'cli_agent' | 'api_direct' | 'litellm_proxy' | 'local_server';
    available: boolean;
    version?: string;
    endpoint?: string;
    models?: string[];
    capabilities?: string[];
    error?: string;
}
export interface ProviderConfigTemplate {
    id: string;
    name: string;
    type: string;
    defaultConfig: Record<string, any>;
    requiredEnvVars: string[];
    optionalEnvVars: string[];
    validationRules: Record<string, any>;
    setupInstructions: string;
}
export declare class LLMProviderConfigurationService extends EventEmitter2 implements OnModuleInit {
    private readonly logger;
    private configTemplates;
    private discoveredProviders;
    constructor();
    onModuleInit(): Promise<void>;
    /**
     * Discover all available LLM providers
     */
    discoverAvailableProviders(): Promise<ProviderDiscoveryResult[]>;
    /**
     * Discover CLI agents
     */
    private discoverCLIAgents;
    /**
     * Discover LiteLLM proxy
     */
    private discoverLiteLLMProxy;
    /**
     * Discover local servers
     */
    private discoverLocalServers;
    /**
     * Discover API providers
     */
    private discoverAPIProviders;
    /**
     * Get CLI agent capabilities
     */
    private getCLIAgentCapabilities;
    /**
     * Generate configuration for a provider
     */
    generateProviderConfig(providerId: string): Promise<Record<string, any> | null>;
    /**
     * Validate provider configuration
     */
    validateProviderConfig(providerId: string, config: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get discovered providers
     */
    getDiscoveredProviders(): ProviderDiscoveryResult[];
    /**
     * Get available providers only
     */
    getAvailableProviders(): ProviderDiscoveryResult[];
    /**
     * Initialize configuration templates
     */
    private initializeConfigTemplates;
}
//# sourceMappingURL=LLMProviderConfigurationService.d.ts.map