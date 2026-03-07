// @ts-nocheck
import { useAI } from '@/hooks/useAI';
import React from 'react';
import { AutoComplete } from './AutoComplete';
import { CodeSuggestions } from './CodeSuggestions';

export const AICodeAssistant: React.FC = () => {
  const { suggestions, completions, context } = useAI();

  return (
    <div className="ai-assistant">
      <CodeSuggestions suggestions={suggestions} context={context} />
      <AutoComplete completions={completions} inline />
    </div>
  );
};
