import { createContext } from 'react';

export interface SuggestionActionsContextType {
  submitSuggestion: (suggestion: any) => Promise<void>;
}

export const SuggestionActionsContext = createContext<SuggestionActionsContextType | null>(null);
