import React from 'react';
import { useAI } from '@/hooks/useAI';
import { CodeSuggestions } from './CodeSuggestions.js';
import { AutoComplete } from './AutoComplete.js';

export const AICodeAssistant: React.FC = () => {
  const { suggestions, completions, context } = useAI();

  return (
    <div className="ai-assistant">
      <CodeSuggestions
        suggestions={suggestions}
        context={context}
      />
      <AutoComplete
        completions={completions}
        inline
      />
    </div>
  );
};
