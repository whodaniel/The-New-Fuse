import { createContext } from 'react';

export interface SuggestionActionsContextType {
  submitSuggestion: (content: string) => Promise<void>;
  approveSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
}

export const SuggestionActionsContext = createContext<SuggestionActionsContextType>({
  submitSuggestion: async () => {},
  approveSuggestion: async () => {},
  rejectSuggestion: async () => {}
});