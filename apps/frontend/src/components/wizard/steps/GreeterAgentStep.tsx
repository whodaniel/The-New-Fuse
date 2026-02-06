import React from 'react';
import { GreeterAgent } from '../GreeterAgent';
import { useWizard } from '../WizardProvider';

export const GreeterAgentStep: React.FC = () => {
  const { state } = useWizard();
  const userName = state.session?.data?.name || 'there';

  return (
    <div>
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Meet Your AI Assistant</h2>
          <p className="mb-4">
            This is your AI assistant for The New Fuse platform. You can ask questions, get help,
            and learn more about the platform.
          </p>
        </div>

        <GreeterAgent
          initialMessage={`Hello ${userName}! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know about The New Fuse?`}
          agentName="Fuse Assistant"
        />

        <div>
          <p className="text-sm text-gray-600">
            This assistant uses Retrieval Augmented Generation (RAG) to provide accurate and helpful
            information about The New Fuse platform. It has access to the latest documentation and
            can help you with any questions you might have.
          </p>
        </div>
      </div>
    </div>
  );
};
