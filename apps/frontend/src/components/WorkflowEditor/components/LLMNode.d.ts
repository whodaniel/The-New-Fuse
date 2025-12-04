import React from 'react';
interface LLMNodeProps {
    id: string;
    data: {
        label: string;
        llmProviderId: string;
        prompt: string;
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
        onLLMProviderChange: (llmProviderId: string) => void;
        onPromptChange: (prompt: string) => void;
        onSystemPromptChange: (systemPrompt: string) => void;
        onMaxTokensChange: (maxTokens: number) => void;
        onTemperatureChange: (temperature: number) => void;
    };
    isConnectable: boolean;
}
export declare const LLMNode: React.FC<LLMNodeProps>;
export {};
