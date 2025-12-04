import React, { ReactNode } from 'react';
export interface WizardSession {
    userType: 'human' | 'ai_agent' | 'unknown';
    startTime: Date;
    data: Record<string, any>;
}
export interface WizardState {
    isInitialized: boolean;
    currentStep: number;
    session: WizardSession | null;
    activeAgents: Map<string, boolean>;
    conversationHistory: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
    }>;
    error: string | null;
}
type WizardAction = {
    type: 'INITIALIZE_SESSION';
    payload: WizardSession;
} | {
    type: 'SET_STEP';
    payload: number;
} | {
    type: 'UPDATE_AGENTS';
    payload: Map<string, boolean>;
} | {
    type: 'ADD_CONVERSATION';
    payload: {
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
    };
} | {
    type: 'UPDATE_SESSION_DATA';
    payload: Record<string, any>;
} | {
    type: 'SET_ERROR';
    payload: string;
} | {
    type: 'CLEAR_ERROR';
};
interface WizardContextType {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
    initializeSession: (session: WizardSession) => void;
    setStep: (step: number) => void;
    updateAgents: (agents: Map<string, boolean>) => void;
    addConversation: (conversation: {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }) => void;
    updateSessionData: (data: Record<string, any>) => void;
    clearError: () => void;
}
interface WizardProviderProps {
    children: ReactNode;
}
export declare function WizardProvider({ children }: WizardProviderProps): JSX.Element;
export declare function useWizard(): WizardContextType;
export {};
