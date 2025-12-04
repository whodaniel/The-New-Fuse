import React from 'react';
export interface LLMProvider {
    id: string;
    name: string;
    provider: string;
    modelName: string;
    isDefault?: boolean;
    isCustom?: boolean;
}
export interface LLMSelectorProps {
    selectedProviderId?: string;
    onChange: (providerId: string) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}
export declare const LLMSelector: React.FC<LLMSelectorProps>;
