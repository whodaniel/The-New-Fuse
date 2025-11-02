import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatModelSelection from './ChatModelSelection';

export default function WorkspaceLLMSelectionPage() {
  const { workspaceId } = useParams();
  const [hasChanges, setHasChanges] = useState(false);
  
  // Mock workspace data - in a real app, this would come from context or API
  const workspace = {
    chatModel: 'gpt-4',
  };
  
  // Default provider - in a real app, this might come from URL params or context
  const provider = 'openai';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat Model Selection</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ChatModelSelection
            provider={provider}
            workspace={workspace}
            setHasChanges={setHasChanges}
          />
          {hasChanges && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">You have unsaved changes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}