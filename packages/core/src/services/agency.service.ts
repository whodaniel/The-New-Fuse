/**
 * Agency Service - Multi-Tenant Agency Management
 *
 * This service manages "Agencies" which are white-label instances of TNF.
 * Agencies can have their own:
 * - Users (with AGENCY_OWNER, AGENCY_ADMIN, AGENCY_MANAGER roles)
 * - Agents
 * - Workflows
 * - Revenue configurations (via FuseAgencyRegistry on-chain)
 *
 * NOTE: This uses Workspace as the organizational container until the
 * Organization model is migrated from schema.enhanced.db.backup
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { drizzleWorkspaceRepository } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Agency types - maps to OrganizationType.AGENCY when Organization model is active
export interface AgencyProfile {
  id: string;
  name: string;
  slug: string; // subdomain-compatible identifier (e.g., "acme" -> acme.thenewfuse.hub)
  description?: string;

  // Owner information
  ownerId: string;
  ownerEmail?: string;

  // Configuration
  settings: AgencySettings;

  // Billing (for FuseAgencyRegistry integration)
  licenseId?: string; // On-chain NFT token ID from FuseAgencyRegistry
  licenseStatus: 'none' | 'active' | 'expired' | 'sovereign';
  revenueShare: {
    house: number; // Agency's share (e.g., 60%)
    investors: number;
    affiliates: number;
  };

  // Limits
  agentLimit: number;
  userLimit: number;

  // Statistics (computed)
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalUsers: number;
    activeUsers: number;
    totalWorkflows: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AgencySettings {
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    customDomain?: string;
  };
  features: {
    enableAgentMarketplace: boolean;
    enableWorkflowBuilder: boolean;
    enableA2ACommunication: boolean;
    enableBlockchainFeatures: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    slackWebhook?: string;
    discordWebhook?: string;
  };
}

export interface CreateAgencyDto {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  settings?: Partial<AgencySettings>;
}

export interface UpdateAgencyDto {
  name?: string;
  description?: string;
  settings?: Partial<AgencySettings>;
  isActive?: boolean;
}

const DEFAULT_SETTINGS: AgencySettings = {
  branding: {},
  features: {
    enableAgentMarketplace: true,
    enableWorkflowBuilder: true,
    enableA2ACommunication: true,
    enableBlockchainFeatures: false,
  },
  notifications: {
    emailEnabled: true,
  },
};

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Create a new agency (white-label instance)
   * Uses Workspace model as organizational container
   */
  async createAgency(dto: CreateAgencyDto): Promise<AgencyProfile> {
    this.logger.log(`Creating agency: ${dto.name} (${dto.slug})`);

    // Validate slug format (subdomain-compatible)
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(dto.slug) && dto.slug.length > 2) {
      throw new BadRequestException(
        'Slug must be lowercase alphanumeric with optional hyphens, no leading/trailing hyphens',
      );
    }

    // Check if slug is already taken
    const existingWorkspace = await drizzleWorkspaceRepository.findByName(dto.slug);

    if (existingWorkspace) {
      throw new BadRequestException(`Agency slug "${dto.slug}" is already taken`);
    }

    // Create workspace as agency container
    const workspace = await drizzleWorkspaceRepository.create({
      name: dto.slug,
      description: JSON.stringify({
        displayName: dto.name,
        description: dto.description,
        type: 'AGENCY',
        settings: { ...DEFAULT_SETTINGS, ...dto.settings },
        licenseId: null,
        licenseStatus: 'none',
        revenueShare: { house: 60, investors: 30, affiliates: 10 },
        agentLimit: 5,
        userLimit: 10,
      }),
      ownerId: dto.ownerId,
    });

    this.eventEmitter.emit('agency.created', { agencyId: workspace.id, slug: dto.slug });
    this.logger.log(`Agency created: ${workspace.id}`);

    return this.workspaceToAgencyProfile(workspace);
  }

  /**
   * Get agency by ID
   */
  async getAgency(agencyId: string): Promise<AgencyProfile> {
    const workspace = await drizzleWorkspaceRepository.findByIdWithOwner(agencyId);

    if (!workspace) {
      throw new NotFoundException(`Agency not found: ${agencyId}`);
    }

    return this.workspaceToAgencyProfile(workspace);
  }

  /**
   * Get agency by slug (subdomain)
   */
  async getAgencyBySlug(slug: string): Promise<AgencyProfile> {
    const workspace = await drizzleWorkspaceRepository.findByNameWithOwner(slug);

    if (!workspace) {
      throw new NotFoundException(`Agency not found: ${slug}`);
    }

    return this.workspaceToAgencyProfile(workspace);
  }

  /**
   * Update agency configuration
   */
  async updateAgency(agencyId: string, dto: UpdateAgencyDto): Promise<AgencyProfile> {
    const existing = await this.getAgency(agencyId);

    const updatedDescription = {
      ...this.parseWorkspaceDescription(existing),
      ...(dto.name && { displayName: dto.name }),
      ...(dto.description && { description: dto.description }),
      ...(dto.settings && { settings: { ...existing.settings, ...dto.settings } }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    await drizzleWorkspaceRepository.update(agencyId, {
      description: JSON.stringify(updatedDescription),
    });

    const workspace = await drizzleWorkspaceRepository.findByIdWithOwner(agencyId);

    this.eventEmitter.emit('agency.updated', { agencyId, changes: dto });
    return this.workspaceToAgencyProfile(workspace);
  }

  /**
   * Delete an agency
   */
  async deleteAgency(agencyId: string): Promise<void> {
    const agency = await this.getAgency(agencyId);

    await drizzleWorkspaceRepository.delete(agencyId);

    this.eventEmitter.emit('agency.deleted', { agencyId, slug: agency.slug });
    this.logger.log(`Agency deleted: ${agencyId}`);
  }

  /**
   * List all agencies for an owner
   */
  async listAgenciesForOwner(ownerId: string): Promise<AgencyProfile[]> {
    const workspaces = await drizzleWorkspaceRepository.findByOwnerWithOwner(ownerId);

    // Filter to only agency-type workspaces
    return workspaces
      .filter((w: any) => {
        try {
          const desc = JSON.parse(w.description || '{}');
          return desc.type === 'AGENCY';
        } catch {
          return false;
        }
      })
      .map((w: any) => this.workspaceToAgencyProfile(w));
  }

  /**
   * List all agencies (admin only)
   */
  async listAllAgencies(): Promise<AgencyProfile[]> {
    const workspaces = await drizzleWorkspaceRepository.findAllWithOwner();

    return workspaces
      .filter((w: any) => {
        try {
          const desc = JSON.parse(w.description || '{}');
          return desc.type === 'AGENCY';
        } catch {
          return false;
        }
      })
      .map((w: any) => this.workspaceToAgencyProfile(w));
  }

  /**
   * Get agency statistics
   */
  async getAgencyStats(agencyId: string): Promise<AgencyProfile['stats']> {
    // In a full implementation, this would aggregate data from
    // agents, users, workflows etc. that belong to this agency
    const agency = await this.getAgency(agencyId);
    return agency.stats;
  }

  /**
   * Update agency license (from blockchain event)
   */
  async updateAgencyLicense(
    agencyId: string,
    licenseId: string,
    status: 'active' | 'expired' | 'sovereign',
  ): Promise<AgencyProfile> {
    const existing = await this.getAgency(agencyId);
    const parsedDesc = this.parseWorkspaceDescription(existing);

    parsedDesc.licenseId = licenseId;
    parsedDesc.licenseStatus = status;

    // Sovereign agencies get 100% revenue (0% to platform)
    if (status === 'sovereign') {
      parsedDesc.revenueShare = { house: 100, investors: 0, affiliates: 0 };
    }

    await drizzleWorkspaceRepository.update(agencyId, {
      description: JSON.stringify(parsedDesc),
    });

    const workspace = await drizzleWorkspaceRepository.findByIdWithOwner(agencyId);

    this.eventEmitter.emit('agency.license.updated', { agencyId, licenseId, status });
    return this.workspaceToAgencyProfile(workspace);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private parseWorkspaceDescription(workspace: any): any {
    try {
      if (typeof workspace === 'string') {
        return JSON.parse(workspace);
      }
      if (workspace.description) {
        return JSON.parse(workspace.description);
      }
      return {};
    } catch {
      return {};
    }
  }

  private workspaceToAgencyProfile(workspace: any): AgencyProfile {
    const desc = this.parseWorkspaceDescription(workspace);

    return {
      id: workspace.id,
      name: desc.displayName || workspace.name,
      slug: workspace.name,
      description: desc.description,
      ownerId: workspace.ownerId,
      ownerEmail: workspace.owner?.email,
      settings: desc.settings || DEFAULT_SETTINGS,
      licenseId: desc.licenseId,
      licenseStatus: desc.licenseStatus || 'none',
      revenueShare: desc.revenueShare || { house: 60, investors: 30, affiliates: 10 },
      agentLimit: desc.agentLimit || 5,
      userLimit: desc.userLimit || 10,
      stats: {
        totalAgents: 0,
        activeAgents: 0,
        totalUsers: 1, // Owner
        activeUsers: 1,
        totalWorkflows: workspace.projects?.length || 0,
      },
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      isActive: desc.isActive !== false,
    };
  }
}
