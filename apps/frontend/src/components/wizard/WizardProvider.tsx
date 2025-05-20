import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Define types for the wizard state
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

// Define action types
type WizardAction =
  | { type: 'INITIALIZE_SESSION'; payload: WizardSession }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_AGENTS'; payload: Map<string, boolean> }
  | { type: 'ADD_CONVERSATION'; payload: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date } }
  | { type: 'UPDATE_SESSION_DATA'; payload: Record<string, any> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Define the context type
interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  initializeSession: (session: WizardSession) => void;
  setStep: (step: number) => void;
  updateAgents: (agents: Map<string, boolean>) => void;
  addConversation: (conversation: { role: 'user' | 'assistant' | 'system'; content: string }) => void;
  updateSessionData: (data: Record<string, any>) => void;
  clearError: () => void;
}

// Initial state
const initialState: WizardState = {
  isInitialized: false,
  currentStep: 0,
  session: null,
  activeAgents: new Map(),
  conversationHistory: [],
  error: null
};

// Reducer function
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'INITIALIZE_SESSION':
      return {
        ...state,
        isInitialized: true,
        session: action.payload,
        error: null
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
    case 'UPDATE_AGENTS':
      return {
        ...state,
        activeAgents: action.payload
      };
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversationHistory: [...state.conversationHistory, action.payload]
      };
    case 'UPDATE_SESSION_DATA':
      return {
        ...state,
        session: state.session ? {
          ...state.session,
          data: {
            ...state.session.data,
            ...action.payload
          }
        } : null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// Create context
const WizardContext = createContext<WizardContextType | null>(null);

// Provider component
interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const initializeSession = useCallback((session: WizardSession) => {
    dispatch({ type: 'INITIALIZE_SESSION', payload: session });
  }, []);

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const updateAgents = useCallback((agents: Map<string, boolean>) => {
    dispatch({ type: 'UPDATE_AGENTS', payload: agents });
  }, []);

  const addConversation = useCallback((conversation: { role: 'user' | 'assistant' | 'system'; content: string }) => {
    dispatch({
      type: 'ADD_CONVERSATION',
      payload: {
        ...conversation,
        timestamp: new Date()
      }
    });
  }, []);

  const updateSessionData = useCallback((data: Record<string, any>) => {
    dispatch({ type: 'UPDATE_SESSION_DATA', payload: data });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <WizardContext.Provider
      value={{
        state,
        dispatch,
        initializeSession,
        setStep,
        updateAgents,
        addConversation,
        updateSessionData,
        clearError
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

// Custom hook to use the wizard context
export function useWizard(): WizardContextType {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
export {};
//# sourceMappingURL=WizardProvider.js.map