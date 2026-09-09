import React, { useMemo } from 'react';
import { buildGreeterContext } from '../../../services/onboardingGreeter';
import { GreeterAgent } from '../GreeterAgent';
import { useWizard } from '../WizardProvider';

export const GreeterAgentStep: React.FC = () => {
  const { state } = useWizard();
  const userName = state.session?.data?.name || 'there';
  const userType = (state.session?.userType as 'human' | 'ai_agent' | 'unknown') || 'unknown';

  const stepContext = useMemo(
    () =>
      buildGreeterContext({
        stepLabel: 'Meet Your Assistant',
        userType,
        userName: typeof userName === 'string' ? userName : undefined,
        // Scrub + allowlist happens inside buildGreeterContext — raw keys never reach the AI.
        sessionData: state.session?.data,
      }),
    [state.session?.data, userName, userType]
  );

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
          stepContext={stepContext}
        />

        <div>
          <p className="text-sm text-muted-foreground">
            Provider API keys and workspace secrets stay on this device and are never included in
            assistant prompts. Suggestions are advisory — you can write in custom values at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
