// @ts-nocheck
/**
 * Agency Controller
 *
 * REST API endpoints for agency (white-label instance) management.
 * Integrates with the local AgencyService.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';

// Local services
import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';

// ============================================================================
// INLINE TYPES (from @the-new-fuse/core/services/agency.service)
// ============================================================================

export interface AgencyProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  ownerEmail?: string;
  settings: AgencySettings;
  licenseId?: string;
  licenseStatus: 'none' | 'active' | 'expired' | 'sovereign';
  revenueShare: {
    house: number;
    investors: number;
    affiliates: number;
  };
  agentLimit: number;
  userLimit: number;
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalUsers: number;
    activeUsers: number;
    totalWorkflows: number;
  };
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

// ============================================================================
// LOCAL AGENCY SERVICE (inline implementation)
// ============================================================================

class AgencyServiceLocal {
  private readonly logger = new Logger(AgencyServiceLocal.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async createAgency(dto: CreateAgencyDto): Promise<AgencyProfile> {
    this.logger.log(`Creating agency: ${dto.name} (${dto.slug})`);

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(dto.slug) && dto.slug.length > 2) {
      throw new BadRequestException('Slug must be lowercase alphanumeric with optional hyphens');
    }

    const existingWorkspace = await this.db.workspaces.findByName(dto.slug);

    if (existingWorkspace) {
      throw new BadRequestException(`Agency slug "${dto.slug}" is already taken`);
    }

    const workspace = await this.db.workspaces.create({
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
    return this.workspaceToAgencyProfile(workspace);
  }

  async getAgency(agencyId: string): Promise<AgencyProfile> {
    const workspace = await this.db.workspaces.findByIdWithOwner(agencyId);

    if (!workspace) throw new NotFoundException(`Agency not found: ${agencyId}`);
    return this.workspaceToAgencyProfile(workspace);
  }

  async getAgencyBySlug(slug: string): Promise<AgencyProfile> {
    const workspace = await this.db.workspaces.findByNameWithOwner(slug);

    if (!workspace) throw new NotFoundException(`Agency not found: ${slug}`);
    return this.workspaceToAgencyProfile(workspace);
  }

  async updateAgency(agencyId: string, dto: UpdateAgencyDto): Promise<AgencyProfile> {
    const existing = await this.getAgency(agencyId);
    const parsedDesc = this.parseWorkspaceDescription(existing);

    const updatedDescription = {
      ...parsedDesc,
      ...(dto.name && { displayName: dto.name }),
      ...(dto.description && { description: dto.description }),
      ...(dto.settings && { settings: { ...existing.settings, ...dto.settings } }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const workspace = await this.db.workspaces.update(agencyId, {
      description: JSON.stringify(updatedDescription),
    });

    if (!workspace) throw new NotFoundException(`Agency not found: ${agencyId}`);

    // Drizzle update returns the record, need to fetch owner info separately or mock it if we trust the update
    // For consistency with getAgency, let's fetch it again properly
    const fullWorkspace = await this.db.workspaces.findByIdWithOwner(agencyId);

    if (!fullWorkspace) throw new NotFoundException(`Agency not found after update: ${agencyId}`);

    this.eventEmitter.emit('agency.updated', { agencyId, changes: dto });
    return this.workspaceToAgencyProfile(fullWorkspace);
  }

  async deleteAgency(agencyId: string): Promise<void> {
    const agency = await this.getAgency(agencyId);
    await this.db.workspaces.delete(agencyId);
    this.eventEmitter.emit('agency.deleted', { agencyId, slug: agency.slug });
  }

  async listAgenciesForOwner(ownerId: string): Promise<AgencyProfile[]> {
    const workspaces = await this.db.workspaces.findByOwnerWithOwner(ownerId);

    return workspaces
      .filter((w) => {
        try {
          const desc = JSON.parse(w.description || '{}');
          return desc.type === 'AGENCY';
        } catch {
          return false;
        }
      })
      .map((w) => this.workspaceToAgencyProfile(w));
  }

  async getAgencyStats(agencyId: string): Promise<AgencyProfile['stats']> {
    const agency = await this.getAgency(agencyId);
    return agency.stats;
  }

  private parseWorkspaceDescription(workspace: any): any {
    try {
      if (typeof workspace === 'string') return JSON.parse(workspace);
      if (workspace.description) return JSON.parse(workspace.description);
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
        totalUsers: 1,
        activeUsers: 1,
        totalWorkflows: workspace.projects?.length || 0,
      },
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      isActive: desc.isActive !== false,
    };
  }
}

// ============================================================================
// API DTOs
// ============================================================================

class CreateAgencyApiDto {
  name!: string;
  slug!: string;
  description?: string;
}

class UpdateAgencyApiDto {
  name?: string;
  description?: string;
  settings?: {
    branding?: { primaryColor?: string; secondaryColor?: string; logoUrl?: string };
    features?: {
      enableAgentMarketplace?: boolean;
      enableWorkflowBuilder?: boolean;
      enableA2ACommunication?: boolean;
    };
  };
  isActive?: boolean;
}

class InitializeSwarmDto {
  maxConcurrentExecutions?: number;
  enableAutoScaling?: boolean;
}

class RegisterProvidersDto {
  providers!: Array<{
    name: string;
    type: 'llm' | 'tool' | 'integration' | 'custom';
    endpoint?: string;
    capabilities: string[];
    isActive: boolean;
  }>;
}

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('agencies')
@Controller('agencies')
@ApiBearerAuth()
export class AgencyController {
  private readonly logger = new Logger(AgencyController.name);
  private readonly agencyService: AgencyServiceLocal;

  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly swarmService: AgentSwarmOrchestrationService
  ) {
    this.agencyService = new AgencyServiceLocal(db, eventEmitter);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agency (white-label instance)' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or slug already taken' })
  async createAgency(
    @Body() dto: CreateAgencyApiDto,
    @Query('ownerId') ownerId: string
  ): Promise<AgencyProfile> {
    try {
      if (!ownerId) {
        throw new HttpException('Owner ID is required', HttpStatus.BAD_REQUEST);
      }

      const createDto: CreateAgencyDto = {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        ownerId,
      };

      const agency = await this.agencyService.createAgency(createDto);
      this.logger.log(`Agency created: ${agency.id} (${agency.slug})`);
      return agency;
    } catch (error) {
      this.logger.error(`Failed to create agency: ${(error as Error).message}`);
      throw new HttpException(
        (error as Error).message || 'Failed to create agency',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'List agencies for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Agencies retrieved' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner user ID' })
  async listAgencies(@Query('ownerId') ownerId: string): Promise<AgencyProfile[]> {
    try {
      if (!ownerId) {
        throw new HttpException('Owner ID is required', HttpStatus.BAD_REQUEST);
      }
      return await this.agencyService.listAgenciesForOwner(ownerId);
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to list agencies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':agencyId')
  @ApiOperation({ summary: 'Get agency details with status' })
  @ApiResponse({ status: 200, description: 'Agency details retrieved' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @ApiParam({ name: 'agencyId', description: 'Agency UUID or slug' })
  async getAgency(@Param('agencyId') agencyId: string): Promise<AgencyProfile> {
    try {
      // Try ID first, then slug
      try {
        return await this.agencyService.getAgency(agencyId);
      } catch {
        return await this.agencyService.getAgencyBySlug(agencyId);
      }
    } catch (error) {
      throw new HttpException((error as Error).message || 'Agency not found', HttpStatus.NOT_FOUND);
    }
  }

  @Put(':agencyId')
  @ApiOperation({ summary: 'Update agency configuration' })
  @ApiResponse({ status: 200, description: 'Agency updated successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async updateAgency(
    @Param('agencyId') agencyId: string,
    @Body() dto: UpdateAgencyApiDto
  ): Promise<AgencyProfile> {
    try {
      const updateDto: UpdateAgencyDto = {
        name: dto.name,
        description: dto.description,
        settings: dto.settings as any,
        isActive: dto.isActive,
      };
      return await this.agencyService.updateAgency(agencyId, updateDto);
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to update agency',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':agencyId')
  @ApiOperation({ summary: 'Delete an agency' })
  @ApiResponse({ status: 204, description: 'Agency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async deleteAgency(@Param('agencyId') agencyId: string): Promise<{ message: string }> {
    try {
      await this.agencyService.deleteAgency(agencyId);
      return { message: `Agency ${agencyId} deleted successfully` };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to delete agency',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==========================================================================
  // Swarm Orchestration Endpoints
  // ==========================================================================

  @Post(':agencyId/swarm/initialize')
  @ApiOperation({ summary: 'Initialize swarm orchestration for agency' })
  @ApiResponse({ status: 200, description: 'Swarm initialized successfully' })
  async initializeSwarm(
    @Param('agencyId') agencyId: string,
    @Body() config?: InitializeSwarmDto
  ): Promise<{
    success: boolean;
    agencyId: string;
    message: string;
    swarmStatus?: any;
  }> {
    try {
      // Verify agency exists
      await this.agencyService.getAgency(agencyId);

      // Initialize swarm for this agency
      await this.swarmService.initializeAgencySwarm(agencyId);
      const result = await this.swarmService.initializeSwarm();
      const status = await this.swarmService.getSwarmStatus(agencyId);

      this.logger.log(`Swarm initialized for agency ${agencyId}`);

      return {
        success: true,
        agencyId,
        message: result.message,
        swarmStatus: status,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to initialize swarm',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId/swarm/status')
  @ApiOperation({ summary: 'Get current swarm status for agency' })
  @ApiResponse({ status: 200, description: 'Swarm status retrieved' })
  async getSwarmStatus(@Param('agencyId') agencyId: string): Promise<{
    agencyId: string;
    swarmEnabled: boolean;
    status: any;
  }> {
    try {
      // Verify agency exists
      await this.agencyService.getAgency(agencyId);

      const status = await this.swarmService.getSwarmStatus(agencyId);

      return {
        agencyId,
        swarmEnabled: status.isSwarmEnabled,
        status,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get swarm status',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // ==========================================================================
  // Provider Management Endpoints
  // ==========================================================================

  @Post(':agencyId/providers/register')
  @ApiOperation({ summary: 'Register service providers for agency' })
  @ApiResponse({ status: 201, description: 'Providers registered successfully' })
  async registerProviders(
    @Param('agencyId') agencyId: string,
    @Body() dto: RegisterProvidersDto
  ): Promise<{
    success: boolean;
    registered: number;
    providers: any[];
  }> {
    try {
      // Verify agency exists
      await this.agencyService.getAgency(agencyId);

      // In production, would persist these providers
      const registered = dto.providers.map((p, idx) => ({
        id: `${agencyId}_provider_${Date.now()}_${idx}`,
        ...p,
      }));

      this.logger.log(`Registered ${registered.length} providers for agency ${agencyId}`);

      return {
        success: true,
        registered: registered.length,
        providers: registered,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to register providers',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId/providers')
  @ApiOperation({ summary: 'Get all service providers for agency' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getProviders(
    @Param('agencyId') agencyId: string,
    @Query('type') type?: string,
    @Query('active') active?: string
  ): Promise<{
    agencyId: string;
    providers: any[];
  }> {
    try {
      // Verify agency exists
      await this.agencyService.getAgency(agencyId);

      // In production, would fetch from database
      // For now, return empty array - providers are ephemeral
      return {
        agencyId,
        providers: [],
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get providers',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // ==========================================================================
  // Analytics Endpoints
  // ==========================================================================

  @Get(':agencyId/analytics')
  @ApiOperation({ summary: 'Get agency performance analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe (e.g., 7d, 30d, 90d)' })
  async getAnalytics(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: any,
    @Query('timeframe') timeframe: string = '30d'
  ): Promise<{
    agencyId: string;
    period: string;
    agents: any;
    tasks: any;
    swarm: any;
  }> {
    try {
      const agency = await this.agencyService.getAgency(agencyId);
      const swarmStatus = await this.swarmService.getSwarmStatus(agencyId);

      // Get date range
      const now = new Date();
      const startDate = this.getDateFromTimeframe(timeframe, now);

      // Fetch analytics data using Drizzle
      const agents = await this.db.agents.findAll(user.id, 100);

      // Tasks filtering
      const tasks = await this.db.tasks.findTasksCreatedAfter(startDate, user.id);

      const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
      const failedTasks = tasks.filter((t: any) => t.status === 'FAILED');

      const byType: Record<string, number> = {};
      agents.forEach((a: any) => {
        const type = a.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        agencyId,
        period: timeframe,
        agents: {
          total: agents.length,
          active: agents.filter((a: any) => a.status === 'ACTIVE').length,
          byType,
        },
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          failed: failedTasks.length,
          successRate:
            tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        },
        swarm: {
          enabled: swarmStatus.isSwarmEnabled,
          totalAgents: swarmStatus.totalProviders,
          onlineAgents: swarmStatus.activeProviders,
          activeExecutions: swarmStatus.activeExecutions,
        },
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get analytics',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/stats')
  @ApiOperation({ summary: 'Get quick agency statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats(@Param('agencyId') agencyId: string): Promise<{
    agencyId: string;
    stats: AgencyProfile['stats'];
  }> {
    try {
      const stats = await this.agencyService.getAgencyStats(agencyId);
      return { agencyId, stats };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to get stats',
        HttpStatus.NOT_FOUND
      );
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private getDateFromTimeframe(timeframe: string, now: Date): Date {
    const match = timeframe.match(/^(\d+)([dhwmy])$/);

    if (!match) {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'w':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
      case 'y':
        return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
