// @ts-nocheck
import { Card } from '@the-new-fuse/ui-consolidated';
import { CheckCircle } from 'lucide-react';
import React from 'react';
import { useWizard } from '../WizardProvider';

export const WelcomeStep: React.FC = () => {
  const { state } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <img
          src="/assets/images/logo.png"
          alt="The New Fuse Logo"
          className="max-h-24 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold mb-2">
          {isAIAgent ? 'Welcome to The New Fuse Agent Network' : 'Welcome to The New Fuse'}
        </h1>
        <p className="text-lg text-gray-600">
          {isAIAgent
            ? 'This wizard will guide you through the process of integrating with our AI agent network.'
            : 'This wizard will guide you through the setup process to get you started quickly.'}
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <Card.Content>
          <h2 className="text-lg font-semibold mb-4 text-blue-700">
            {isAIAgent ? 'Agent Integration Benefits' : 'Key Features'}
          </h2>

          <div className="space-y-3">
            {isAIAgent ? (
              // AI Agent benefits
              <>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Seamless communication with other AI agents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Access to powerful tools and capabilities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Standardized protocols for agent interaction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Secure and reliable message exchange</span>
                </div>
              </>
            ) : (
              // Human user features
              <>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Create and manage AI agent workflows</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Seamless integration with development environments</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Powerful tools for AI agent collaboration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Intuitive interface for managing complex AI systems</span>
                </div>
              </>
            )}
          </div>
        </Card.Content>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">
          {isAIAgent ? 'Integration Process' : 'Getting Started'}
        </h2>
        <p className="mb-3">
          {isAIAgent
            ? 'This wizard will guide you through the following steps to integrate with The New Fuse platform:'
            : 'This wizard will guide you through the following steps to set up your account:'}
        </p>
        <div className="space-y-2 pl-4">
          {isAIAgent ? (
            // AI Agent steps
            <>
              <p>1. Configure your agent profile</p>
              <p>2. Define your agent capabilities</p>
              <p>3. Set up communication channels</p>
              <p>4. Complete integration</p>
            </>
          ) : (
            // Human user steps
            <>
              <p>1. Set up your user profile</p>
              <p>2. Configure your AI preferences</p>
              <p>3. Create your first workspace</p>
              <p>4. Select tools and integrations</p>
              <p>5. Meet your AI assistant</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
