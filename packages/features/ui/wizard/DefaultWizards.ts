/**
 * Default Wizards
 *
 * Pre-built wizard flows for common user goals in The New Fuse platform.
 */

import { ValidationResult, WizardBuilder, WizardContext, WizardDefinition } from './WizardSystem';

/**
 * Get Started Wizard - First-time user onboarding
 */
export function createGetStartedWizard(): WizardDefinition {
  return new WizardBuilder('get-started', 'Get Started with The New Fuse')
    .description('Complete onboarding to set up your account and create your first agent')
    .category('onboarding')
    .goal('Get started with the platform')
    .targetAudience(['beginner', 'all'])
    .estimatedTime(10)
    .outcomes([
      'Account fully configured',
      'First agent created',
      'Understanding of core features',
      'Workspace set up',
    ])
    .tags(['onboarding', 'setup', 'beginner', 'first-time'])
    .addStep({
      id: 'welcome',
      title: 'Welcome to The New Fuse',
      description: 'Learn about what you can accomplish with AI agents',
      component: 'WelcomeScreen',
      canSkip: false,
      estimatedTime: 30,
      helpText: 'This introduction will help you understand the platform capabilities',
      tips: [
        'Take your time to explore each feature',
        'You can always revisit this wizard from the Help menu',
        'Interactive demos are available for each feature',
      ],
      nextStep: 'profile-setup',
    })
    .addStep({
      id: 'profile-setup',
      title: 'Set Up Your Profile',
      description: 'Tell us about yourself and your goals',
      component: 'ProfileSetup',
      canSkip: false,
      estimatedTime: 120,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { name, email, goals } = context.data;

        const errors: string[] = [];
        if (!name) errors.push('Name is required');
        if (!email) errors.push('Email is required');
        if (!goals || (goals as string[]).length === 0) {
          errors.push('Please select at least one goal');
        }

        return {
          valid: errors.length === 0,
          errors,
          suggestions: errors.length === 0 ? ['Great! Your profile is complete'] : undefined,
        };
      },
      helpText: 'Your profile helps us personalize your experience',
      tips: [
        'Select goals that match your primary use cases',
        'You can update your profile anytime',
        'We use this to recommend relevant wizards and features',
      ],
      requirements: ['Full name', 'Valid email', 'At least one goal'],
      previousStep: 'welcome',
      nextStep: 'workspace-setup',
    })
    .addStep({
      id: 'workspace-setup',
      title: 'Create Your Workspace',
      description: 'Set up your first workspace for organizing agents',
      component: 'WorkspaceSetup',
      canSkip: false,
      estimatedTime: 60,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { workspaceName, workspaceType } = context.data;

        if (!workspaceName) {
          return {
            valid: false,
            errors: ['Workspace name is required'],
          };
        }

        return { valid: true };
      },
      helpText: 'Workspaces help you organize agents by project or team',
      tips: [
        'You can create multiple workspaces',
        'Invite team members to collaborate',
        'Each workspace has its own settings and permissions',
      ],
      previousStep: 'profile-setup',
      nextStep: 'create-first-agent',
    })
    .addStep({
      id: 'create-first-agent',
      title: 'Create Your First Agent',
      description: 'Build a simple AI agent to get started',
      component: 'SimpleAgentCreator',
      canSkip: false,
      estimatedTime: 180,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { agentName, agentType, agentPurpose } = context.data;

        const errors: string[] = [];
        if (!agentName) errors.push('Agent name is required');
        if (!agentType) errors.push('Agent type is required');
        if (!agentPurpose) errors.push('Agent purpose is required');

        return { valid: errors.length === 0, errors };
      },
      helpText: 'Your first agent can be simple - you can always enhance it later',
      tips: [
        'Start with a clear, specific purpose',
        'Choose pre-built templates to get started quickly',
        'You can test your agent before deploying',
      ],
      previousStep: 'workspace-setup',
      nextStep: 'test-agent',
    })
    .addStep({
      id: 'test-agent',
      title: 'Test Your Agent',
      description: 'Try out your newly created agent',
      component: 'AgentTester',
      canSkip: true,
      estimatedTime: 120,
      helpText: 'Testing ensures your agent works as expected',
      tips: [
        'Try different inputs to see how it responds',
        'Check the execution logs for insights',
        'Adjust settings if needed',
      ],
      previousStep: 'create-first-agent',
      nextStep: 'completion',
    })
    .addStep({
      id: 'completion',
      title: "You're All Set!",
      description: 'Explore more features or start using your agent',
      component: 'CompletionScreen',
      canSkip: false,
      estimatedTime: 30,
      helpText: 'Here are your next steps',
      tips: [
        'Explore the agent marketplace for inspiration',
        'Check out advanced features in the documentation',
        'Join the community to share and learn',
      ],
      previousStep: 'test-agent',
    })
    .build();
}

/**
 * Create Agent Wizard - Guided agent creation
 */
export function createAgentCreationWizard(): WizardDefinition {
  return new WizardBuilder('create-agent', 'Create an AI Agent')
    .description('Step-by-step guide to creating a powerful AI agent')
    .category('agent-creation')
    .goal('Create a fully functional AI agent')
    .targetAudience(['all'])
    .estimatedTime(15)
    .outcomes([
      'Configured agent with specific capabilities',
      'Tested and validated agent',
      'Understanding of agent configuration',
    ])
    .tags(['agent', 'creation', 'build'])
    .addStep({
      id: 'agent-purpose',
      title: 'Define Agent Purpose',
      description: 'What should your agent do?',
      component: 'AgentPurposeSelector',
      canSkip: false,
      estimatedTime: 60,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { purpose, useCase } = context.data;

        if (!purpose || !useCase) {
          return {
            valid: false,
            errors: ['Please define the agent purpose and use case'],
          };
        }

        return { valid: true };
      },
      nextStep: 'select-capabilities',
    })
    .addStep({
      id: 'select-capabilities',
      title: 'Select Capabilities',
      description: 'Choose what your agent can do',
      component: 'CapabilitySelector',
      canSkip: false,
      estimatedTime: 180,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { capabilities } = context.data;

        if (!capabilities || (capabilities as string[]).length === 0) {
          return {
            valid: false,
            errors: ['Please select at least one capability'],
          };
        }

        return { valid: true };
      },
      helpText: 'Capabilities determine what tools your agent can use',
      tips: [
        'Start with essential capabilities',
        'You can add more capabilities later',
        'Some capabilities require additional configuration',
      ],
      previousStep: 'agent-purpose',
      nextStep: 'configure-llm',
    })
    .addStep({
      id: 'configure-llm',
      title: 'Configure AI Model',
      description: 'Choose the AI model powering your agent',
      component: 'LLMConfiguration',
      canSkip: false,
      estimatedTime: 120,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { llmProvider, model } = context.data;

        if (!llmProvider || !model) {
          return {
            valid: false,
            errors: ['Please select an LLM provider and model'],
          };
        }

        return { valid: true };
      },
      helpText: 'Different models have different strengths and costs',
      tips: [
        'GPT-4 offers best reasoning for complex tasks',
        'Claude excels at following instructions',
        'Smaller models are faster and cheaper for simple tasks',
      ],
      previousStep: 'select-capabilities',
      nextStep: 'security-settings',
    })
    .addStep({
      id: 'security-settings',
      title: 'Configure Security',
      description: 'Set permissions and access controls',
      component: 'SecurityConfiguration',
      canSkip: true,
      estimatedTime: 120,
      helpText: 'Security settings protect your agent and data',
      tips: [
        'Use least privilege principle',
        'Enable audit logging for sensitive operations',
        'Set resource quotas to prevent abuse',
      ],
      previousStep: 'configure-llm',
      nextStep: 'test-and-deploy',
    })
    .addStep({
      id: 'test-and-deploy',
      title: 'Test & Deploy',
      description: 'Verify your agent works and deploy it',
      component: 'TestAndDeploy',
      canSkip: false,
      estimatedTime: 180,
      helpText: 'Always test before deploying to production',
      tips: [
        'Run multiple test cases',
        'Check logs for any errors',
        'Start with a staging deployment',
      ],
      previousStep: 'security-settings',
    })
    .build();
}

/**
 * Deploy to Railway Wizard
 */
export function createDeployToRailwayWizard(): WizardDefinition {
  return new WizardBuilder('deploy-railway', 'Deploy to Railway')
    .description('Deploy your cloud sandbox to Railway with proper configuration')
    .category('deployment')
    .goal('Successfully deploy to Railway')
    .targetAudience(['intermediate', 'advanced'])
    .estimatedTime(20)
    .prerequisites(['Railway account', 'GitHub repository connected'])
    .outcomes([
      'Service deployed to Railway',
      'Environment variables configured',
      'Health checks passing',
      'Custom domain configured (optional)',
    ])
    .tags(['deployment', 'railway', 'production', 'devops'])
    .addStep({
      id: 'connect-github',
      title: 'Connect GitHub Repository',
      description: 'Link your GitHub repository to Railway',
      component: 'GitHubConnection',
      canSkip: false,
      estimatedTime: 120,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { repositoryConnected } = context.data;

        if (!repositoryConnected) {
          return {
            valid: false,
            errors: ['GitHub repository must be connected'],
          };
        }

        return { valid: true };
      },
      nextStep: 'configure-service',
    })
    .addStep({
      id: 'configure-service',
      title: 'Configure Railway Service',
      description: 'Set up your service configuration',
      component: 'RailwayServiceConfig',
      canSkip: false,
      estimatedTime: 180,
      helpText: 'Service configuration defines how Railway builds and runs your app',
      tips: [
        'Use the recommended Dockerfile for best results',
        'Set appropriate resource limits',
        'Enable health checks',
      ],
      previousStep: 'connect-github',
      nextStep: 'environment-variables',
    })
    .addStep({
      id: 'environment-variables',
      title: 'Set Environment Variables',
      description: 'Configure required environment variables',
      component: 'EnvironmentVariables',
      canSkip: false,
      estimatedTime: 300,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { jwtSecret, databaseUrl } = context.data;

        const errors: string[] = [];
        if (!jwtSecret) errors.push('JWT_SECRET is required');
        if (!databaseUrl) errors.push('DATABASE_URL is required');

        return { valid: errors.length === 0, errors };
      },
      helpText: 'These variables are critical for security and functionality',
      requirements: ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'],
      previousStep: 'configure-service',
      nextStep: 'database-setup',
    })
    .addStep({
      id: 'database-setup',
      title: 'Provision Database',
      description: 'Set up PostgreSQL database on Railway',
      component: 'DatabaseProvision',
      canSkip: false,
      estimatedTime: 180,
      helpText: 'Railway provides managed PostgreSQL with automatic backups',
      previousStep: 'environment-variables',
      nextStep: 'deploy',
    })
    .addStep({
      id: 'deploy',
      title: 'Deploy Service',
      description: 'Deploy your application to Railway',
      component: 'DeploymentTrigger',
      canSkip: false,
      estimatedTime: 600,
      helpText: 'This will build and deploy your application',
      tips: [
        'Watch the build logs for any errors',
        'First deployment takes longer',
        'Subsequent deployments are faster',
      ],
      previousStep: 'database-setup',
      nextStep: 'verify-deployment',
    })
    .addStep({
      id: 'verify-deployment',
      title: 'Verify Deployment',
      description: 'Check that your service is running correctly',
      component: 'DeploymentVerification',
      canSkip: false,
      estimatedTime: 120,
      validation: async (context: WizardContext): Promise<ValidationResult> => {
        const { healthCheckPassing } = context.data;

        if (!healthCheckPassing) {
          return {
            valid: false,
            errors: ['Health check is failing'],
            suggestions: ['Check logs for errors', 'Verify environment variables'],
          };
        }

        return { valid: true };
      },
      previousStep: 'deploy',
      nextStep: (context) => {
        return context.data.configureCustomDomain ? 'custom-domain' : 'completion';
      },
    })
    .addStep({
      id: 'custom-domain',
      title: 'Configure Custom Domain',
      description: 'Set up your custom domain (optional)',
      component: 'CustomDomainSetup',
      canSkip: true,
      estimatedTime: 180,
      helpText: 'Custom domains make your service accessible via your own domain',
      previousStep: 'verify-deployment',
      nextStep: 'completion',
    })
    .addStep({
      id: 'completion',
      title: 'Deployment Complete!',
      description: 'Your service is now live on Railway',
      component: 'DeploymentSuccess',
      canSkip: false,
      estimatedTime: 30,
      previousStep: (context) => {
        return context.data.configureCustomDomain ? 'custom-domain' : 'verify-deployment';
      },
    })
    .build();
}

/**
 * Configure RBAC Wizard
 */
export function createConfigureRBACWizard(): WizardDefinition {
  return new WizardBuilder('configure-rbac', 'Configure Role-Based Access Control')
    .description('Set up roles and permissions for your team and agents')
    .category('security')
    .goal('Implement secure access control')
    .targetAudience(['intermediate', 'advanced'])
    .estimatedTime(15)
    .outcomes([
      'Roles defined',
      'Permissions assigned',
      'Users assigned to roles',
      'Agents configured with capabilities',
    ])
    .tags(['security', 'rbac', 'permissions', 'access-control'])
    .addStep({
      id: 'understand-roles',
      title: 'Understand Roles',
      description: 'Learn about the role hierarchy',
      component: 'RoleExplainer',
      canSkip: true,
      estimatedTime: 120,
      helpText: 'The New Fuse has 7 built-in roles with different permissions',
      nextStep: 'assign-user-roles',
    })
    .addStep({
      id: 'assign-user-roles',
      title: 'Assign User Roles',
      description: 'Set roles for human users',
      component: 'UserRoleAssignment',
      canSkip: false,
      estimatedTime: 180,
      helpText: 'Assign the minimum necessary role to each user',
      tips: [
        'Use principle of least privilege',
        'SUPER_ADMIN should be limited to a few trusted users',
        'Regular users can be assigned USER role',
      ],
      previousStep: 'understand-roles',
      nextStep: 'configure-agent-capabilities',
    })
    .addStep({
      id: 'configure-agent-capabilities',
      title: 'Configure Agent Capabilities',
      description: 'Define what each agent can do',
      component: 'AgentCapabilityConfig',
      canSkip: false,
      estimatedTime: 240,
      helpText: 'Capabilities determine which tools agents can access',
      tips: [
        'Grant only necessary capabilities',
        'Test agent behavior after changes',
        'Review capability usage in audit logs',
      ],
      previousStep: 'assign-user-roles',
      nextStep: 'set-quotas',
    })
    .addStep({
      id: 'set-quotas',
      title: 'Set Resource Quotas',
      description: 'Define resource limits per tenant/user',
      component: 'QuotaConfiguration',
      canSkip: false,
      estimatedTime: 180,
      helpText: 'Quotas prevent abuse and manage costs',
      tips: [
        'Start conservative and adjust based on usage',
        'Monitor quota usage regularly',
        'Set up alerts for quota violations',
      ],
      previousStep: 'configure-agent-capabilities',
      nextStep: 'enable-audit-logging',
    })
    .addStep({
      id: 'enable-audit-logging',
      title: 'Enable Audit Logging',
      description: 'Track all security-relevant events',
      component: 'AuditLogConfig',
      canSkip: false,
      estimatedTime: 120,
      helpText: 'Audit logs are essential for compliance and security',
      previousStep: 'set-quotas',
      nextStep: 'test-permissions',
    })
    .addStep({
      id: 'test-permissions',
      title: 'Test Permissions',
      description: 'Verify access control works correctly',
      component: 'PermissionTester',
      canSkip: true,
      estimatedTime: 180,
      helpText: 'Testing ensures your RBAC configuration is working',
      tips: [
        'Test with different user roles',
        'Verify agents cannot exceed their capabilities',
        'Check audit logs are being created',
      ],
      previousStep: 'enable-audit-logging',
    })
    .build();
}

/**
 * Troubleshooting Wizard
 */
export function createTroubleshootingWizard(): WizardDefinition {
  return new WizardBuilder('troubleshooting', 'Troubleshoot Issues')
    .description('Diagnose and fix common problems')
    .category('support')
    .goal('Resolve technical issues')
    .targetAudience(['all'])
    .estimatedTime(10)
    .tags(['troubleshooting', 'debugging', 'support', 'help'])
    .addStep({
      id: 'identify-issue',
      title: 'Identify the Issue',
      description: 'What problem are you experiencing?',
      component: 'IssueIdentifier',
      canSkip: false,
      estimatedTime: 60,
      nextStep: (context) => {
        const issueType = context.data.issueType as string;

        switch (issueType) {
          case 'authentication':
            return 'auth-troubleshooting';
          case 'agent-not-working':
            return 'agent-troubleshooting';
          case 'deployment':
            return 'deployment-troubleshooting';
          case 'performance':
            return 'performance-troubleshooting';
          default:
            return 'general-troubleshooting';
        }
      },
    })
    .addStep({
      id: 'auth-troubleshooting',
      title: 'Authentication Issues',
      description: 'Fix login and permission problems',
      component: 'AuthTroubleshooting',
      canSkip: false,
      estimatedTime: 180,
      previousStep: 'identify-issue',
      nextStep: 'check-resolution',
    })
    .addStep({
      id: 'agent-troubleshooting',
      title: 'Agent Issues',
      description: 'Debug agent behavior',
      component: 'AgentTroubleshooting',
      canSkip: false,
      estimatedTime: 240,
      previousStep: 'identify-issue',
      nextStep: 'check-resolution',
    })
    .addStep({
      id: 'deployment-troubleshooting',
      title: 'Deployment Issues',
      description: 'Fix deployment problems',
      component: 'DeploymentTroubleshooting',
      canSkip: false,
      estimatedTime: 300,
      previousStep: 'identify-issue',
      nextStep: 'check-resolution',
    })
    .addStep({
      id: 'performance-troubleshooting',
      title: 'Performance Issues',
      description: 'Optimize slow operations',
      component: 'PerformanceTroubleshooting',
      canSkip: false,
      estimatedTime: 240,
      previousStep: 'identify-issue',
      nextStep: 'check-resolution',
    })
    .addStep({
      id: 'general-troubleshooting',
      title: 'General Troubleshooting',
      description: 'Common solutions',
      component: 'GeneralTroubleshooting',
      canSkip: false,
      estimatedTime: 180,
      previousStep: 'identify-issue',
      nextStep: 'check-resolution',
    })
    .addStep({
      id: 'check-resolution',
      title: 'Check Resolution',
      description: 'Did this solve your problem?',
      component: 'ResolutionCheck',
      canSkip: false,
      estimatedTime: 30,
      nextStep: (context) => {
        return context.data.resolved ? 'completion' : 'contact-support';
      },
    })
    .addStep({
      id: 'contact-support',
      title: 'Contact Support',
      description: 'Get help from our team',
      component: 'SupportContact',
      canSkip: false,
      estimatedTime: 60,
      previousStep: 'check-resolution',
    })
    .addStep({
      id: 'completion',
      title: 'Issue Resolved',
      description: 'Glad we could help!',
      component: 'TroubleshootingComplete',
      canSkip: false,
      estimatedTime: 15,
      previousStep: 'check-resolution',
    })
    .build();
}

/**
 * Export all default wizards
 */
export const DEFAULT_WIZARDS = [
  createGetStartedWizard(),
  createAgentCreationWizard(),
  createDeployToRailwayWizard(),
  createConfigureRBACWizard(),
  createTroubleshootingWizard(),
];
