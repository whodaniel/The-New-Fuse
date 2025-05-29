/**
 * Agency Service - Core service for managing multi-tenant agencies
 * Handles agency creation, management, provisioning, and lifecycle operations
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AgencyTemplateService } from './agency-template.service';
import { BillingService } from '../billing/billing.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  Agency, 
  AgencyTier, 
  SubscriptionStatus, 
  EnhancedUserRole,
  AgencySubscription 
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAgencyDto {
  name: string;
  subdomain: string;
  slug?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  tier?: AgencyTier;
  billingEmail?: string;
  template?: string;
  customDomain?: string;
}

export interface AgencyWithStats extends Agency {
  stats: {
    userCount: number;
    agentCount: number;
    chatCount: number;
    storageUsed: number;
  };
  subscription?: AgencySubscription;
}

export interface AgencyFeatures {
  maxUsers: number;
  maxAgents: number;
  maxStorage: number; // MB
  customBranding: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  ssoIntegration: boolean;
}

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly templateService: AgencyTemplateService,
    private readonly billingService: BillingService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Create a new agency with initial setup
   */
  async createAgency(data: CreateAgencyDto): Promise<AgencyWithStats> {
    this.logger.log(`Creating new agency: ${data.name} (${data.subdomain})`);

    // Validate inputs
    await this.validateAgencyCreation(data);

    // Create agency with transaction
    const agency = await this.prisma.$transaction(async (tx) => {
      // 1. Create the agency
      const newAgency = await tx.agency.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          slug: data.slug || this.generateSlug(data.name),
          subscriptionTier: data.tier || AgencyTier.TRIAL,
          subscriptionStatus: data.tier === AgencyTier.TRIAL ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
          billingEmail: data.billingEmail || data.adminEmail,
          trialEndsAt: data.tier === AgencyTier.TRIAL 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : null,
          settings: this.getDefaultSettings(data.tier || AgencyTier.TRIAL),
          branding: this.getDefaultBranding(),
          ...this.getTierLimits(data.tier || AgencyTier.TRIAL)
        }
      });

      // 2. Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          name: data.adminName,
          agencyId: newAgency.id,
          role: EnhancedUserRole.AGENCY_ADMIN,
          passwordHash: await this.hashPassword(data.adminPassword),
          isActive: true,
          onboardingCompleted: false
        }
      });

      // 3. Provision default resources
      await this.provisionDefaultResources(tx, newAgency.id, data.template);

      // 4. Create subscription record if not trial
      if (data.tier && data.tier !== AgencyTier.TRIAL) {
        await tx.agencySubscription.create({
          data: {
            agencyId: newAgency.id,
            tier: data.tier,
            status: SubscriptionStatus.ACTIVE,
            pricePerMonth: this.getTierPrice(data.tier),
            startedAt: new Date()
          }
        });
      }

      // 5. Create audit log
      await tx.agencyAuditLog.create({
        data: {
          agencyId: newAgency.id,
          action: 'CREATE_AGENCY',
          actorId: adminUser.id,
          actorRole: 'AGENCY_ADMIN',
          newValues: {
            agencyName: newAgency.name,
            tier: newAgency.subscriptionTier,
            adminEmail: data.adminEmail
          },
          metadata: { source: 'agency_creation' }
        }
      });

      return newAgency;
    });

    // Clear cache
    await this.clearAgencyCache(agency.subdomain);

    // Emit events
    this.eventEmitter.emit('agency.created', {
      agencyId: agency.id,
      subdomain: agency.subdomain,
      tier: agency.subscriptionTier,
      adminEmail: data.adminEmail
    });

    // Set up billing if needed
    if (data.tier && data.tier !== AgencyTier.TRIAL) {
      try {
        await this.billingService.createAgencySubscription(agency.id, data.tier);
      } catch (error) {
        this.logger.error(`Failed to create billing subscription for agency ${agency.id}:`, error);
        // Don't fail agency creation, but log for manual follow-up
      }
    }

    this.logger.log(`Successfully created agency: ${agency.id}`);
    
    return this.getAgencyWithStats(agency.id);
  }

  /**
   * Get agency by subdomain with caching
   */
  async getAgencyBySubdomain(subdomain: string): Promise<Agency | null> {
    const cacheKey = `agency:subdomain:${subdomain}`;
    
    // Check cache first
    let agency = await this.cacheService.get<Agency>(cacheKey);
    
    if (!agency) {
      // Database lookup
      agency = await this.prisma.agency.findUnique({
        where: { 
          subdomain,
          isActive: true 
        }
      });
      
      // Cache for 5 minutes if found
      if (agency) {
        await this.cacheService.set(cacheKey, agency, 300);
      }
    }
    
    return agency;
  }

  /**
   * Get agency with statistics
   */
  async getAgencyWithStats(agencyId: string): Promise<AgencyWithStats> {
    const [agency, stats, subscription] = await Promise.all([
      this.prisma.agency.findUnique({
        where: { id: agencyId }
      }),
      this.getAgencyStats(agencyId),
      this.getActiveSubscription(agencyId)
    ]);

    if (!agency) {
      throw new NotFoundException(`Agency ${agencyId} not found`);
    }

    return {
      ...agency,
      stats,
      subscription
    };
  }

  /**
   * Update agency settings
   */
  async updateAgency(
    agencyId: string, 
    updates: Partial<Pick<Agency, 'name' | 'settings' | 'branding'>>,
    actorId: string
  ): Promise<Agency> {
    const existingAgency = await this.prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!existingAgency) {
      throw new NotFoundException(`Agency ${agencyId} not found`);
    }

    const updatedAgency = await this.prisma.$transaction(async (tx) => {
      // Update agency
      const agency = await tx.agency.update({
        where: { id: agencyId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.agencyAuditLog.create({
        data: {
          agencyId,
          action: 'UPDATE_AGENCY',
          actorId,
          oldValues: {
            name: existingAgency.name,
            settings: existingAgency.settings,
            branding: existingAgency.branding
          },
          newValues: updates,
          metadata: { source: 'agency_update' }
        }
      });

      return agency;
    });

    // Clear cache
    await this.clearAgencyCache(updatedAgency.subdomain);

    this.eventEmitter.emit('agency.updated', {
      agencyId,
      changes: updates,
      actorId
    });

    return updatedAgency;
  }

  /**
   * Suspend/activate agency
   */
  async setAgencyStatus(
    agencyId: string, 
    isActive: boolean, 
    reason: string,
    actorId: string
  ): Promise<Agency> {
    const agency = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.agency.update({
        where: { id: agencyId },
        data: { 
          isActive,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.agencyAuditLog.create({
        data: {
          agencyId,
          action: isActive ? 'ACTIVATE_AGENCY' : 'SUSPEND_AGENCY',
          actorId,
          newValues: { isActive, reason },
          metadata: { reason, source: 'agency_status_change' }
        }
      });

      return updated;
    });

    // Clear cache
    await this.clearAgencyCache(agency.subdomain);

    this.eventEmitter.emit('agency.status_changed', {
      agencyId,
      isActive,
      reason,
      actorId
    });

    return agency;
  }

  /**
   * Get agency features based on subscription tier
   */
  getAgencyFeatures(tier: AgencyTier): AgencyFeatures {
    const featureMap: Record<AgencyTier, AgencyFeatures> = {
      [AgencyTier.TRIAL]: {
        maxUsers: 3,
        maxAgents: 5,
        maxStorage: 100,
        customBranding: false,
        customDomain: false,
        whiteLabel: false,
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: false,
        ssoIntegration: false
      },
      [AgencyTier.STARTER]: {
        maxUsers: 10,
        maxAgents: 25,
        maxStorage: 1000,
        customBranding: false,
        customDomain: false,
        whiteLabel: false,
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: true,
        ssoIntegration: false
      },
      [AgencyTier.PROFESSIONAL]: {
        maxUsers: 50,
        maxAgents: 100,
        maxStorage: 10000,
        customBranding: true,
        customDomain: true,
        whiteLabel: false,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        ssoIntegration: true
      },
      [AgencyTier.ENTERPRISE]: {
        maxUsers: 500,
        maxAgents: 1000,
        maxStorage: 100000,
        customBranding: true,
        customDomain: true,
        whiteLabel: false,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        ssoIntegration: true
      },
      [AgencyTier.WHITE_LABEL]: {
        maxUsers: -1, // unlimited
        maxAgents: -1, // unlimited
        maxStorage: -1, // unlimited
        customBranding: true,
        customDomain: true,
        whiteLabel: true,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        ssoIntegration: true
      }
    };

    return featureMap[tier];
  }

  /**
   * List agencies with filtering and pagination
   */
  async listAgencies(options: {
    page?: number;
    limit?: number;
    tier?: AgencyTier;
    status?: SubscriptionStatus;
    search?: string;
    isActive?: boolean;
  } = {}): Promise<{ agencies: AgencyWithStats[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      tier,
      status,
      search,
      isActive
    } = options;

    const where: any = {};
    
    if (tier) where.subscriptionTier = tier;
    if (status) where.subscriptionStatus = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.agency.count({ where })
    ]);

    // Get stats for each agency
    const agenciesWithStats = await Promise.all(
      agencies.map(async (agency) => {
        const [stats, subscription] = await Promise.all([
          this.getAgencyStats(agency.id),
          this.getActiveSubscription(agency.id)
        ]);
        
        return {
          ...agency,
          stats,
          subscription
        };
      })
    );

    return { agencies: agenciesWithStats, total };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async validateAgencyCreation(data: CreateAgencyDto): Promise<void> {
    // Validate subdomain
    if (!this.isValidSubdomain(data.subdomain)) {
      throw new BadRequestException('Invalid subdomain format');
    }

    // Check if subdomain is reserved
    if (this.isReservedSubdomain(data.subdomain)) {
      throw new BadRequestException('Subdomain is reserved');
    }

    // Check subdomain availability
    const existingAgency = await this.prisma.agency.findUnique({
      where: { subdomain: data.subdomain }
    });

    if (existingAgency) {
      throw new ConflictException('Subdomain already exists');
    }

    // Validate admin email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.adminEmail }
    });

    if (existingUser) {
      throw new ConflictException('Admin email already in use');
    }
  }

  private isValidSubdomain(subdomain: string): boolean {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    return subdomain.length >= 3 && 
           subdomain.length <= 63 && 
           subdomainRegex.test(subdomain);
  }

  private isReservedSubdomain(subdomain: string): boolean {
    const reserved = [
      'www', 'api', 'admin', 'app', 'mail', 'email', 'smtp', 'ftp', 
      'blog', 'forum', 'shop', 'store', 'support', 'help', 'docs',
      'staging', 'test', 'dev', 'demo', 'beta', 'alpha'
    ];
    return reserved.includes(subdomain.toLowerCase());
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private getDefaultSettings(tier: AgencyTier): any {
    return {
      allowedFeatures: this.getAgencyFeatures(tier),
      onboardingEnabled: true,
      analyticsEnabled: tier !== AgencyTier.TRIAL,
      integrations: {
        slack: false,
        discord: false,
        teams: false
      }
    };
  }

  private getDefaultBranding(): any {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logo: null,
      favicon: null,
      fonts: {
        primary: 'Inter',
        secondary: 'Inter'
      }
    };
  }

  private getTierLimits(tier: AgencyTier): { userLimit: number; agentLimit: number; storageLimit: number } {
    const features = this.getAgencyFeatures(tier);
    return {
      userLimit: features.maxUsers === -1 ? 10000 : features.maxUsers,
      agentLimit: features.maxAgents === -1 ? 10000 : features.maxAgents,
      storageLimit: features.maxStorage === -1 ? 1000000 : features.maxStorage
    };
  }

  private getTierPrice(tier: AgencyTier): number {
    const priceMap: Record<AgencyTier, number> = {
      [AgencyTier.TRIAL]: 0,
      [AgencyTier.STARTER]: 29,
      [AgencyTier.PROFESSIONAL]: 99,
      [AgencyTier.ENTERPRISE]: 299,
      [AgencyTier.WHITE_LABEL]: 999
    };
    return priceMap[tier];
  }

  private async provisionDefaultResources(
    tx: any,
    agencyId: string,
    template?: string
  ): Promise<void> {
    const templateData = await this.templateService.getTemplate(template || 'basic');
    
    // Create default agents
    for (const agentTemplate of templateData.agents) {
      await tx.agent.create({
        data: {
          ...agentTemplate,
          id: uuidv4(),
          agencyId,
          allowedFeatures: agentTemplate.allowedFeatures || [],
          resourceLimits: agentTemplate.resourceLimits || {}
        }
      });
    }
  }

  private async getAgencyStats(agencyId: string): Promise<{
    userCount: number;
    agentCount: number;
    chatCount: number;
    storageUsed: number;
  }> {
    const [userCount, agentCount, chatCount] = await Promise.all([
      this.prisma.user.count({ where: { agencyId } }),
      this.prisma.agent.count({ where: { agencyId } }),
      this.prisma.chat.count({ where: { agencyId } })
    ]);

    // Calculate storage used (simplified)
    const storageUsed = 0; // TODO: Implement actual storage calculation

    return {
      userCount,
      agentCount,
      chatCount,
      storageUsed
    };
  }

  private async getActiveSubscription(agencyId: string): Promise<AgencySubscription | null> {
    return this.prisma.agencySubscription.findFirst({
      where: {
        agencyId,
        status: SubscriptionStatus.ACTIVE
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private async clearAgencyCache(subdomain: string): Promise<void> {
    await this.cacheService.del(`agency:subdomain:${subdomain}`);
  }
}
