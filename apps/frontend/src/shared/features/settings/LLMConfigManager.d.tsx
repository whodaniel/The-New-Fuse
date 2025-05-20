import React from 'react';
import { LLMProviderConfig } from '@/types/unified';
interface LLMConfigManagerProps {
    currentConfig: LLMProviderConfig;
    onConfigUpdate?: (config: LLMProviderConfig) => void;
}
export declare function LLMConfigManager({ currentConfig, onConfigUpdate }: LLMConfigManagerProps): React.JSX.Element;
export {};
