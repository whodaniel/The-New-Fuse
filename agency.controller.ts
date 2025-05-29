import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgencyService } from '../services/agency.service';
import { AgencyTemplateService } from '../services/agency-template.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { 
  CreateAgencyDto,
  UpdateAgencyDto,
  AgencyResponseDto,
  AgencyListResponseDto,
  ApplyTemplateDto,
  AgencyStatsDto,
  AgencyUsageDto,
  AgencySubscriptionDto,
} from '../dto/agency.dto';
import { Agency, AgencySubscriptionTier, UserRole } from '@prisma/client';

@ApiTags('agencies')
@Controller('agencies')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgencyController {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly agencyTemplateService: AgencyTemplateService,
  ) {}

  @Get()
  @Roles(UserRole.MASTER_ADMIN)
  @ApiOperation({ summary: 'Get all agencies (Master Admin only)' })
  @ApiResponse({ status: 200, description: 'Agencies retrieved successfully', type: AgencyListResponseDto })
  async getAllAgencies(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('tier') tier?: AgencySubscriptionTier,
    @Query('status') status?: string,
  ): Promise<AgencyListResponseDto> {
    return this.agencyService.getAllAgencies({
      page: Number(page),
      limit: Number(limit),
      search,
      tier,
      status,
    });
  }

  @Post()
  @Roles(UserRole.MASTER_ADMIN)
  @ApiOperation({ summary: 'Create new agency (Master Admin only)' })
  @ApiResponse({ status: 201, description: 'Agency created successfully', type: AgencyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid agency data' })
  @ApiResponse({ status: 409, description: 'Agency already exists' })
  async createAgency(
    @Body() createAgencyDto: CreateAgencyDto,
    @Request() req: any,
  ): Promise<AgencyResponseDto> {
    try {
      const agency = await this.agencyService.createAgency(
        createAgencyDto,
        req.user,
      );
      return { agency, message: 'Agency created successfully' };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':agencyId')
  @ApiOperation({ summary: 'Get agency by ID' })
  @ApiResponse({ status: 200, description: 'Agency retrieved successfully', type: AgencyResponseDto })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async getAgencyById(
    @Param('agencyId') agencyId: string,
    @Request() req: any,
  ): Promise<AgencyResponseDto> {
    // Check if user has access to this agency
    await this.validateAgencyAccess(agencyId, req.user);

    const agency = await this.agencyService.getAgencyById(agencyId);
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return { agency, message: 'Agency retrieved successfully' };
  }

  @Put(':agencyId')
  @ApiOperation({ summary: 'Update agency' })
  @ApiResponse({ status: 200, description: 'Agency updated successfully', type: AgencyResponseDto })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateAgency(
    @Param('agencyId') agencyId: string,
    @Body() updateAgencyDto: UpdateAgencyDto,
    @Request() req: any,
  ): Promise<AgencyResponseDto> {
    // Check if user has admin access to this agency
    await this.validateAgencyAdminAccess(agencyId, req.user);

    const agency = await this.agencyService.updateAgency(agencyId, updateAgencyDto);
    return { agency, message: 'Agency updated successfully' };
  }

  @Delete(':agencyId')
  @Roles(UserRole.MASTER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete agency (Master Admin only)' })
  @ApiResponse({ status: 204, description: 'Agency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async deleteAgency(@Param('agencyId') agencyId: string): Promise<void> {
    await this.agencyService.deleteAgency(agencyId);
  }

  @Post(':agencyId/suspend')
  @Roles(UserRole.MASTER_ADMIN)
  @ApiOperation({ summary: 'Suspend agency (Master Admin only)' })
  @ApiResponse({ status: 200, description: 'Agency suspended successfully' })
  async suspendAgency(@Param('agencyId') agencyId: string): Promise<{ message: string }> {
    await this.agencyService.suspendAgency(agencyId);
    return { message: 'Agency suspended successfully' };
  }

  @Post(':agencyId/activate')
  @Roles(UserRole.MASTER_ADMIN)
  @ApiOperation({ summary: 'Activate agency (Master Admin only)' })
  @ApiResponse({ status: 200, description: 'Agency activated successfully' })
  async activateAgency(@Param('agencyId') agencyId: string): Promise<{ message: string }> {
    await this.agencyService.activateAgency(agencyId);
    return { message: 'Agency activated successfully' };
  }

  @Get(':agencyId/stats')
  @ApiOperation({ summary: 'Get agency statistics' })
  @ApiResponse({ status: 200, description: 'Agency stats retrieved successfully', type: AgencyStatsDto })
  async getAgencyStats(
    @Param('agencyId') agencyId: string,
    @Request() req: any,
  ): Promise<AgencyStatsDto> {
    await this.validateAgencyAccess(agencyId, req.user);
    return this.agencyService.getAgencyStats(agencyId);
  }

  @Get(':agencyId/usage')
  @ApiOperation({ summary: 'Get agency usage metrics' })
  @ApiResponse({ status: 200, description: 'Agency usage retrieved successfully', type: AgencyUsageDto })
  async getAgencyUsage(
    @Param('agencyId') agencyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: any,
  ): Promise<AgencyUsageDto> {
    await this.validateAgencyAccess(agencyId, req.user);
    
    return this.agencyService.getAgencyUsage(agencyId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Template Management
  @Get('templates/available')
  @ApiOperation({ summary: 'Get available agency templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAvailableTemplates(
    @Query('tier') tier?: AgencySubscriptionTier,
  ) {
    return this.agencyTemplateService.getAvailableTemplates(tier);
  }

  @Post(':agencyId/apply-template')
  @Roles(UserRole.MASTER_ADMIN, UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Apply template to agency' })
  @ApiResponse({ status: 200, description: 'Template applied successfully' })
  async applyTemplate(
    @Param('agencyId') agencyId: string,
    @Body() applyTemplateDto: ApplyTemplateDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.validateAgencyAdminAccess(agencyId, req.user);

    const agency = await this.agencyService.getAgencyById(agencyId);
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    await this.agencyTemplateService.applyTemplate(
      agency,
      applyTemplateDto.templateName,
      req.user,
    );

    return { message: 'Template applied successfully' };
  }

  // Subscription Management
  @Get(':agencyId/subscription')
  @ApiOperation({ summary: 'Get agency subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully', type: AgencySubscriptionDto })
  async getAgencySubscription(
    @Param('agencyId') agencyId: string,
    @Request() req: any,
  ): Promise<AgencySubscriptionDto> {
    await this.validateAgencyAccess(agencyId, req.user);
    return this.agencyService.getAgencySubscription(agencyId);
  }

  @Put(':agencyId/subscription')
  @Roles(UserRole.MASTER_ADMIN, UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Update agency subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateAgencySubscription(
    @Param('agencyId') agencyId: string,
    @Body() subscriptionDto: Partial<AgencySubscriptionDto>,
    @Request() req: any,
  ): Promise<{ message: string }> {
    // Agency admins can only upgrade, master admins can do anything
    if (req.user.role === UserRole.AGENCY_ADMIN) {
      await this.validateAgencyAdminAccess(agencyId, req.user);
      // Add logic to ensure it's only an upgrade
    }

    await this.agencyService.updateAgencySubscription(agencyId, subscriptionDto);
    return { message: 'Subscription updated successfully' };
  }

  // User Management within Agency
  @Get(':agencyId/users')
  @ApiOperation({ summary: 'Get agency users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAgencyUsers(
    @Param('agencyId') agencyId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('role') role?: UserRole,
    @Request() req: any,
  ) {
    await this.validateAgencyAccess(agencyId, req.user);
    
    return this.agencyService.getAgencyUsers(agencyId, {
      page: Number(page),
      limit: Number(limit),
      role,
    });
  }

  @Post(':agencyId/users/invite')
  @Roles(UserRole.MASTER_ADMIN, UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Invite user to agency' })
  @ApiResponse({ status: 200, description: 'User invited successfully' })
  async inviteUserToAgency(
    @Param('agencyId') agencyId: string,
    @Body() inviteDto: { email: string; role: UserRole },
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.validateAgencyManagerAccess(agencyId, req.user);

    await this.agencyService.inviteUserToAgency(
      agencyId,
      inviteDto.email,
      inviteDto.role,
      req.user,
    );

    return { message: 'User invited successfully' };
  }

  @Delete(':agencyId/users/:userId')
  @Roles(UserRole.MASTER_ADMIN, UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Remove user from agency' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  async removeUserFromAgency(
    @Param('agencyId') agencyId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.validateAgencyAdminAccess(agencyId, req.user);

    await this.agencyService.removeUserFromAgency(agencyId, userId);
    return { message: 'User removed successfully' };
  }

  // Agent Management within Agency
  @Get(':agencyId/agents')
  @ApiOperation({ summary: 'Get agency agents' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  async getAgencyAgents(
    @Param('agencyId') agencyId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('active') active?: boolean,
    @Request() req: any,
  ) {
    await this.validateAgencyAccess(agencyId, req.user);
    
    return this.agencyService.getAgencyAgents(agencyId, {
      page: Number(page),
      limit: Number(limit),
      type,
      active: active !== undefined ? Boolean(active) : undefined,
    });
  }

  // Subdomain Management
  @Get(':agencyId/subdomain/availability')
  @ApiOperation({ summary: 'Check subdomain availability' })
  @ApiResponse({ status: 200, description: 'Subdomain availability checked' })
  async checkSubdomainAvailability(
    @Param('agencyId') agencyId: string,
    @Query('subdomain') subdomain: string,
    @Request() req: any,
  ): Promise<{ available: boolean; suggestions?: string[] }> {
    await this.validateAgencyAdminAccess(agencyId, req.user);
    return this.agencyService.checkSubdomainAvailability(subdomain, agencyId);
  }

  @Put(':agencyId/subdomain')
  @Roles(UserRole.MASTER_ADMIN, UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Update agency subdomain' })
  @ApiResponse({ status: 200, description: 'Subdomain updated successfully' })
  async updateAgencySubdomain(
    @Param('agencyId') agencyId: string,
    @Body() subdomainDto: { subdomain: string },
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.validateAgencyAdminAccess(agencyId, req.user);

    await this.agencyService.updateSubdomain(agencyId, subdomainDto.subdomain);
    return { message: 'Subdomain updated successfully' };
  }

  // Private helper methods
  private async validateAgencyAccess(agencyId: string, user: any): Promise<void> {
    if (user.role === UserRole.MASTER_ADMIN) {
      return; // Master admin has access to all agencies
    }

    const hasAccess = await this.agencyService.userHasAgencyAccess(user.id, agencyId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }
  }

  private async validateAgencyAdminAccess(agencyId: string, user: any): Promise<void> {
    if (user.role === UserRole.MASTER_ADMIN) {
      return; // Master admin has admin access to all agencies
    }

    const hasAdminAccess = await this.agencyService.userHasAgencyAdminAccess(user.id, agencyId);
    if (!hasAdminAccess) {
      throw new ForbiddenException('Admin access required for this agency');
    }
  }

  private async validateAgencyManagerAccess(agencyId: string, user: any): Promise<void> {
    if (user.role === UserRole.MASTER_ADMIN) {
      return; // Master admin has all access
    }

    const hasManagerAccess = await this.agencyService.userHasAgencyManagerAccess(user.id, agencyId);
    if (!hasManagerAccess) {
      throw new ForbiddenException('Manager access or higher required for this agency');
    }
  }
}
