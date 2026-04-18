import { Button } from '@/components/ui';
import { Book, CheckCircle, Code, Home, MessageSquare, Settings, Users } from 'lucide-react';
import React from 'react';
import { useWizard } from '../WizardProvider';

export const CompletionStep: React.FC = () => {
  const { state } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  const userName = state.session?.data?.name || 'User';

  const humanNextSteps = [
    {
      title: 'Explore Dashboard',
      icon: Home,
      description: 'Get familiar with your dashboard and navigation',
      link: '/dashboard',
    },
    {
      title: 'Configure Workspace',
      icon: Settings,
      description: 'Customize your workspace settings',
      link: '/workspace/settings',
    },
    {
      title: 'Invite Team Members',
      icon: Users,
      description: 'Collaborate with your team',
      link: '/workspace/members',
    },
    {
      title: 'Create Your First Workflow',
      icon: Code,
      description: 'Build an AI workflow with multiple agents',
      link: '/workflows/new',
    },
    {
      title: 'Read Documentation',
      icon: Book,
      description: 'Learn more about The New Fuse',
      link: '/docs',
    },
    {
      title: 'Get Help',
      icon: MessageSquare,
      description: 'Contact support or join the community',
      link: '/support',
    },
  ];

  const agentNextSteps = [
    {
      title: 'API Documentation',
      icon: Book,
      description: 'Explore the API documentation',
      link: '/docs',
    },
    {
      title: 'Test Integration',
      icon: Code,
      description: 'Test your integration with The New Fuse',
      link: '/api/test',
    },
    {
      title: 'Monitor Usage',
      icon: Home,
      description: 'Monitor your API usage and performance',
      link: '/api/dashboard',
    },
    {
      title: 'Join Agent Network',
      icon: Users,
      description: 'Connect with other agents in the network',
      link: '/api/network',
    },
  ];

  const nextSteps = isAIAgent ? agentNextSteps : humanNextSteps;

  return (
    <div>
      <div className="space-y-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isAIAgent ? 'Integration Complete!' : 'Setup Complete!'}
          </h2>
          <p className="text-lg text-muted-foreground">
            {isAIAgent
              ? `Your agent "${userName}" has been successfully integrated with The New Fuse platform.`
              : `Congratulations, ${userName}! You're all set to start using The New Fuse.`}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-md">
                <div className="p-4 pb-0">
                  <div className="flex items-center space-x-2">
                    <step.icon className="text-blue-500" />
                    <h4 className="text-sm font-semibold">{step.title}</h4>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm mb-3">{step.description}</p>
                  <a href={step.link}>
                    <Button size="sm" variant="outline">
                      {isAIAgent ? 'View' : 'Get Started'}
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            {isAIAgent
              ? 'Your agent is now ready to communicate with The New Fuse platform. You can use the API documentation to learn more about the available endpoints and how to use them.'
              : 'Need help getting started? Check out our documentation or contact our support team for assistance.'}
          </p>
        </div>
      </div>
    </div>
  );
};
