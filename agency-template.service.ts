import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AgencyService } from './agency.service';
import { 
  Agency, 
  AgencySubscriptionTier, 
  UserRole,
  Agent,
  User 
} from '@prisma/client';

export interface AgencyTemplate {
  name: string;
  description: string;
  tier: AgencySubscriptionTier;
  defaultAgents: DefaultAgentTemplate[];
  defaultWorkspaces: DefaultWorkspaceTemplate[];
  defaultIntegrations: DefaultIntegrationTemplate[];
  defaultRoles: DefaultRoleTemplate[];
  defaultSettings: Record<string, any>;
}

export interface DefaultAgentTemplate {
  name: string;
  description: string;
  type: string;
  capabilities: string[];
  systemPrompt: string;
  isActive: boolean;
  configuration: Record<string, any>;
}

export interface DefaultWorkspaceTemplate {
  name: string;
  description: string;
  isDefault: boolean;
  settings: Record<string, any>;
}

export interface DefaultIntegrationTemplate {
  name: string;
  type: string;
  description: string;
  configuration: Record<string, any>;
  isEnabled: boolean;
}

export interface DefaultRoleTemplate {
  name: string;
  permissions: string[];
  description: string;
}

@Injectable()
export class AgencyTemplateService {
  private readonly logger = new Logger(AgencyTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyService: AgencyService,
  ) {}

  /**
   * Get available agency templates based on subscription tier
   */
  async getAvailableTemplates(tier: AgencySubscriptionTier = AgencySubscriptionTier.TRIAL): Promise<AgencyTemplate[]> {
    const templates: AgencyTemplate[] = [];

    // Basic template available for all tiers
    templates.push(await this.getBasicTemplate(tier));

    // Professional templates
    if (tier === AgencySubscriptionTier.PROFESSIONAL || 
        tier === AgencySubscriptionTier.ENTERPRISE || 
        tier === AgencySubscriptionTier.WHITE_LABEL) {
      templates.push(await this.getMarketingAgencyTemplate(tier));
      templates.push(await this.getCustomerServiceTemplate(tier));
    }

    // Enterprise templates
    if (tier === AgencySubscriptionTier.ENTERPRISE || 
        tier === AgencySubscriptionTier.WHITE_LABEL) {
      templates.push(await this.getEnterpriseTemplate(tier));
    }

    return templates;
  }

  /**
   * Apply a template to a newly created agency
   */
  async applyTemplate(
    agency: Agency, 
    templateName: string, 
    adminUser: User
  ): Promise<void> {
    try {
      this.logger.log(`Applying template ${templateName} to agency ${agency.id}`);

      const templates = await this.getAvailableTemplates(agency.subscriptionTier);
      const template = templates.find(t => t.name === templateName);

      if (!template) {
        throw new Error(`Template ${templateName} not found or not available for tier ${agency.subscriptionTier}`);
      }

      await this.prisma.$transaction(async (tx) => {
        // Create default workspaces
        for (const workspaceTemplate of template.defaultWorkspaces) {
          await tx.workspace.create({
            data: {
              name: workspaceTemplate.name,
              description: workspaceTemplate.description,
              agencyId: agency.id,
              createdById: adminUser.id,
              isDefault: workspaceTemplate.isDefault,
              settings: workspaceTemplate.settings,
            },
          });
        }

        // Create default agents
        for (const agentTemplate of template.defaultAgents) {
          await tx.agent.create({
            data: {
              name: agentTemplate.name,
              description: agentTemplate.description,
              type: agentTemplate.type,
              agencyId: agency.id,
              createdById: adminUser.id,
              isActive: agentTemplate.isActive,
              capabilities: agentTemplate.capabilities,
              systemPrompt: agentTemplate.systemPrompt,
              configuration: agentTemplate.configuration,
            },
          });
        }

        // Create default roles
        for (const roleTemplate of template.defaultRoles) {
          await tx.role.create({
            data: {
              name: roleTemplate.name,
              description: roleTemplate.description,
              agencyId: agency.id,
              permissions: roleTemplate.permissions,
            },
          });
        }

        // Create default integrations
        for (const integrationTemplate of template.defaultIntegrations) {
          await tx.integration.create({
            data: {
              name: integrationTemplate.name,
              type: integrationTemplate.type,
              description: integrationTemplate.description,
              agencyId: agency.id,
              configuration: integrationTemplate.configuration,
              isEnabled: integrationTemplate.isEnabled,
            },
          });
        }

        // Update agency settings
        await tx.agency.update({
          where: { id: agency.id },
          data: {
            settings: {
              ...agency.settings,
              ...template.defaultSettings,
              templateApplied: templateName,
              templateAppliedAt: new Date(),
            },
          },
        });
      });

      this.logger.log(`Successfully applied template ${templateName} to agency ${agency.id}`);
    } catch (error) {
      this.logger.error(`Failed to apply template ${templateName} to agency ${agency.id}:`, error);
      throw error;
    }
  }

  // Private template definitions

  private async getBasicTemplate(tier: AgencySubscriptionTier): Promise<AgencyTemplate> {
    return {
      name: 'Basic Agency',
      description: 'Essential setup with basic agents and workspace',
      tier,
      defaultAgents: [
        {
          name: 'Assistant',
          description: 'General purpose AI assistant',
          type: 'conversational',
          capabilities: ['chat', 'help', 'information'],
          systemPrompt: 'You are a helpful AI assistant for this agency. Provide professional and accurate assistance to users.',
          isActive: true,
          configuration: {
            maxTokens: 2000,
            temperature: 0.7,
            model: 'gpt-3.5-turbo',
          },
        },
        {
          name: 'Content Creator',
          description: 'AI agent specialized in content creation',
          type: 'content',
          capabilities: ['writing', 'editing', 'brainstorming'],
          systemPrompt: 'You are a creative content specialist. Help users create engaging and professional content.',
          isActive: true,
          configuration: {
            maxTokens: 4000,
            temperature: 0.8,
            model: 'gpt-4',
          },
        },
      ],
      defaultWorkspaces: [
        {
          name: 'Main Workspace',
          description: 'Primary workspace for agency operations',
          isDefault: true,
          settings: {
            theme: 'default',
            layout: 'standard',
            permissions: {
              allowGuestAccess: false,
              defaultUserRole: 'AGENCY_USER',
            },
          },
        },
      ],
      defaultIntegrations: [
        {
          name: 'Email Notifications',
          type: 'notification',
          description: 'Basic email notification system',
          configuration: {
            enabled: true,
            frequency: 'immediate',
          },
          isEnabled: true,
        },
      ],
      defaultRoles: [
        {
          name: 'Agency Manager',
          permissions: [
            'agents:read',
            'agents:write',
            'workspaces:read',
            'workspaces:write',
            'users:read',
            'users:invite',
            'analytics:read',
          ],
          description: 'Manager role with most permissions except billing',
        },
        {
          name: 'Agency User',
          permissions: [
            'agents:read',
            'agents:interact',
            'workspaces:read',
            'chat:create',
            'chat:read',
          ],
          description: 'Standard user role for agency members',
        },
      ],
      defaultSettings: {
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#EF4444',
          logo: null,
        },
        features: {
          chatHistory: true,
          fileUpload: true,
          apiAccess: tier !== AgencySubscriptionTier.TRIAL,
        },
        limits: this.getTierLimits(tier),
      },
    };
  }

  private async getMarketingAgencyTemplate(tier: AgencySubscriptionTier): Promise<AgencyTemplate> {
    const basicTemplate = await this.getBasicTemplate(tier);
    
    return {
      ...basicTemplate,
      name: 'Marketing Agency',
      description: 'Specialized setup for marketing agencies with campaign and social media tools',
      defaultAgents: [
        ...basicTemplate.defaultAgents,
        {
          name: 'Campaign Strategist',
          description: 'AI agent specialized in marketing campaign strategy',
          type: 'marketing',
          capabilities: ['strategy', 'campaigns', 'analytics', 'copywriting'],
          systemPrompt: 'You are a marketing strategy expert. Help users plan, execute, and optimize marketing campaigns.',
          isActive: true,
          configuration: {
            maxTokens: 4000,
            temperature: 0.7,
            model: 'gpt-4',
            specializations: ['digital-marketing', 'content-strategy', 'analytics'],
          },
        },
        {
          name: 'Social Media Manager',
          description: 'AI agent for social media content and strategy',
          type: 'social',
          capabilities: ['social-media', 'content-planning', 'engagement'],
          systemPrompt: 'You are a social media expert. Help create engaging content and manage social media presence.',
          isActive: true,
          configuration: {
            maxTokens: 3000,
            temperature: 0.8,
            model: 'gpt-4',
            platforms: ['facebook', 'instagram', 'twitter', 'linkedin'],
          },
        },
      ],
      defaultWorkspaces: [
        ...basicTemplate.defaultWorkspaces,
        {
          name: 'Campaign Management',
          description: 'Workspace for managing marketing campaigns',
          isDefault: false,
          settings: {
            theme: 'marketing',
            layout: 'campaign-focused',
            tools: ['analytics', 'scheduling', 'reporting'],
          },
        },
      ],
      defaultIntegrations: [
        ...basicTemplate.defaultIntegrations,
        {
          name: 'Social Media Scheduler',
          type: 'social',
          description: 'Integration for scheduling social media posts',
          configuration: {
            platforms: ['facebook', 'instagram', 'twitter', 'linkedin'],
            autoSchedule: false,
          },
          isEnabled: true,
        },
        {
          name: 'Analytics Dashboard',
          type: 'analytics',
          description: 'Marketing analytics and reporting',
          configuration: {
            metrics: ['engagement', 'reach', 'conversions'],
            reportingFrequency: 'weekly',
          },
          isEnabled: true,
        },
      ],
    };
  }

  private async getCustomerServiceTemplate(tier: AgencySubscriptionTier): Promise<AgencyTemplate> {
    const basicTemplate = await this.getBasicTemplate(tier);
    
    return {
      ...basicTemplate,
      name: 'Customer Service Agency',
      description: 'Optimized for customer service operations with support agents and ticketing',
      defaultAgents: [
        ...basicTemplate.defaultAgents,
        {
          name: 'Support Agent',
          description: 'AI agent specialized in customer support',
          type: 'support',
          capabilities: ['customer-service', 'troubleshooting', 'ticket-management'],
          systemPrompt: 'You are a professional customer support agent. Provide helpful, empathetic, and solution-focused assistance.',
          isActive: true,
          configuration: {
            maxTokens: 3000,
            temperature: 0.6,
            model: 'gpt-4',
            responseStyle: 'professional-friendly',
          },
        },
        {
          name: 'Technical Support',
          description: 'AI agent for technical troubleshooting',
          type: 'technical',
          capabilities: ['technical-support', 'debugging', 'documentation'],
          systemPrompt: 'You are a technical support specialist. Provide clear, step-by-step technical assistance.',
          isActive: true,
          configuration: {
            maxTokens: 4000,
            temperature: 0.5,
            model: 'gpt-4',
            knowledgeBase: 'technical-docs',
          },
        },
      ],
      defaultWorkspaces: [
        ...basicTemplate.defaultWorkspaces,
        {
          name: 'Support Center',
          description: 'Workspace for customer support operations',
          isDefault: false,
          settings: {
            theme: 'support',
            layout: 'ticket-focused',
            features: ['ticketing', 'knowledge-base', 'escalation'],
          },
        },
      ],
      defaultIntegrations: [
        ...basicTemplate.defaultIntegrations,
        {
          name: 'Ticket System',
          type: 'ticketing',
          description: 'Customer support ticket management',
          configuration: {
            autoAssignment: true,
            priorityLevels: ['low', 'medium', 'high', 'urgent'],
            slaSettings: {
              responseTime: '2 hours',
              resolutionTime: '24 hours',
            },
          },
          isEnabled: true,
        },
      ],
    };
  }

  private async getEnterpriseTemplate(tier: AgencySubscriptionTier): Promise<AgencyTemplate> {
    const basicTemplate = await this.getBasicTemplate(tier);
    
    return {
      ...basicTemplate,
      name: 'Enterprise Agency',
      description: 'Full-featured setup for enterprise organizations with advanced security and compliance',
      defaultAgents: [
        ...basicTemplate.defaultAgents,
        {
          name: 'Business Analyst',
          description: 'AI agent for business analysis and reporting',
          type: 'business',
          capabilities: ['analysis', 'reporting', 'forecasting', 'strategy'],
          systemPrompt: 'You are a business analyst expert. Provide data-driven insights and strategic recommendations.',
          isActive: true,
          configuration: {
            maxTokens: 6000,
            temperature: 0.5,
            model: 'gpt-4',
            dataAccess: ['analytics', 'reports', 'forecasting'],
          },
        },
        {
          name: 'Compliance Officer',
          description: 'AI agent for compliance and regulatory guidance',
          type: 'compliance',
          capabilities: ['compliance', 'regulations', 'audit', 'documentation'],
          systemPrompt: 'You are a compliance expert. Ensure all recommendations meet regulatory requirements and best practices.',
          isActive: true,
          configuration: {
            maxTokens: 4000,
            temperature: 0.3,
            model: 'gpt-4',
            regulations: ['gdpr', 'ccpa', 'sox', 'iso27001'],
          },
        },
      ],
      defaultIntegrations: [
        ...basicTemplate.defaultIntegrations,
        {
          name: 'SSO Integration',
          type: 'authentication',
          description: 'Single Sign-On integration for enterprise security',
          configuration: {
            provider: 'saml',
            autoProvisioning: true,
            roleMapping: true,
          },
          isEnabled: true,
        },
        {
          name: 'Audit Logging',
          type: 'security',
          description: 'Comprehensive audit logging for compliance',
          configuration: {
            logLevel: 'detailed',
            retention: '7 years',
            encryption: true,
          },
          isEnabled: true,
        },
      ],
      defaultSettings: {
        ...basicTemplate.defaultSettings,
        security: {
          mfaRequired: true,
          passwordPolicy: 'strict',
          sessionTimeout: 30,
          ipRestrictions: false,
        },
        compliance: {
          auditLogging: true,
          dataRetention: '7 years',
          encryptionAtRest: true,
        },
      },
    };
  }

  private getTierLimits(tier: AgencySubscriptionTier): Record<string, number> {
    const limits = {
      [AgencySubscriptionTier.TRIAL]: {
        maxUsers: 3,
        maxAgents: 2,
        maxWorkspaces: 1,
        maxMonthlyChats: 100,
        maxFileSize: 10, // MB
      },
      [AgencySubscriptionTier.STARTER]: {
        maxUsers: 10,
        maxAgents: 5,
        maxWorkspaces: 3,
        maxMonthlyChats: 1000,
        maxFileSize: 50,
      },
      [AgencySubscriptionTier.PROFESSIONAL]: {
        maxUsers: 50,
        maxAgents: 20,
        maxWorkspaces: 10,
        maxMonthlyChats: 10000,
        maxFileSize: 100,
      },
      [AgencySubscriptionTier.ENTERPRISE]: {
        maxUsers: 500,
        maxAgents: 100,
        maxWorkspaces: 50,
        maxMonthlyChats: 100000,
        maxFileSize: 500,
      },
      [AgencySubscriptionTier.WHITE_LABEL]: {
        maxUsers: -1, // unlimited
        maxAgents: -1,
        maxWorkspaces: -1,
        maxMonthlyChats: -1,
        maxFileSize: 1000,
      },
    };

    return limits[tier] || limits[AgencySubscriptionTier.TRIAL];
  }
}
