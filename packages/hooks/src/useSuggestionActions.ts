import { useContext } from 'react';
import { SuggestionActionsContext } from './types/index.js';

export const useSuggestionActions = (): any => {
  const context = useContext(SuggestionActionsContext);
  if (!context) {
    throw new Error('useSuggestionActions must be used within a SuggestionActionsProvider');
  }
  return context;
};