/**
 * Unified LLM Provider Selector
 *
 * Universal component for selecting and configuring LLM providers across all UIs.
 * Supports CLI agents, API providers, LiteLLM proxy, and custom agents.
 *
 * @module UnifiedLLMProviderSelector
 * @since 2025-10-06
 */
import React from 'react';
export interface LLMProvider {
    id: string;
    name: string;
    displayName: string;
    type: 'cli_agent' | 'api_direct' | 'litellm_proxy' | 'local_server' | 'custom_agent';
    status: 'available' | 'unavailable' | 'checking' | 'error';
    vendor: string;
    category: 'major' | 'specialized' | 'local' | 'enterprise';
    models: string[];
    defaultModel: string;
    capabilities: string[];
    costTier: 'free' | 'low' | 'medium' | 'high' | 'enterprise';
    requiresApiKey: boolean;
    endpoint?: string;
    documentation?: string;
    metadata: {
        description: string;
        tags: string[];
        lastHealthCheck?: Date;
    };
}
export interface UnifiedLLMProviderSelectorProps {
    selectedProviderId?: string;
    onProviderChange: (providerId: string, provider: LLMProvider) => void;
    onConfigChange?: (config: any) => void;
    showAdvancedOptions?: boolean;
    filterByType?: string[];
    filterByCapability?: string[];
    className?: string;
}
export declare const UnifiedLLMProviderSelector: React.FC<UnifiedLLMProviderSelectorProps>;
//# sourceMappingURL=UnifiedLLMProviderSelector.d.ts.map