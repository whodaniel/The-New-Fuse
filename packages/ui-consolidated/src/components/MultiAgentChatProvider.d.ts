import React from 'react';
import { MultiAgentChatFirebaseService } from '../services/multi-agent-chat-firebase.service';
import { MultiAgentChatLLMService } from '../services/multi-agent-chat-llm.service';
export declare const useMultiAgentChat: () => any;
declare const EditIcon: () => React.JSX.Element;
declare const DeleteIcon: () => React.JSX.Element;
declare const SettingsIcon: () => React.JSX.Element;
declare const SystemIcon: () => React.JSX.Element;
declare const providerDetails: {
    gemini: {
        icon: () => React.JSX.Element;
        name: string;
    };
    openai: {
        icon: () => React.JSX.Element;
        name: string;
    };
    anthropic: {
        icon: () => React.JSX.Element;
        name: string;
    };
    cohere: {
        icon: () => React.JSX.Element;
        name: string;
    };
    sambanova: {
        icon: () => React.JSX.Element;
        name: string;
    };
    deepseek: {
        icon: () => React.JSX.Element;
        name: string;
    };
    mistral: {
        icon: () => React.JSX.Element;
        name: string;
    };
    openrouter: {
        icon: () => React.JSX.Element;
        name: string;
    };
    'claude-code-cli': {
        icon: () => React.JSX.Element;
        name: string;
    };
};
export declare const MultiAgentChatProvider: React.FC<{
    children: React.ReactNode;
    firebaseService: MultiAgentChatFirebaseService;
    llmService: MultiAgentChatLLMService;
    userId?: string;
}>;
export { EditIcon, DeleteIcon, SettingsIcon, SystemIcon, providerDetails };
//# sourceMappingURL=MultiAgentChatProvider.d.ts.map