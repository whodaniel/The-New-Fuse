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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';

@ApiTags('agencies')
@Controller('api/agencies')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AgencyController {
  constructor(private readonly enhancedAgencyService: EnhancedAgencyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new agency with swarm capabilities' })
  @ApiResponse({ status: 201, description: 'Agency created successfully' })
  async createAgency(@Body() createAgencyDto: any) {
    try {
      return await this.enhancedAgencyService.createAgencyWithSwarm(createAgencyDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create agency',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId')
  @ApiOperation({ summary: 'Get agency details with swarm status' })
  @ApiResponse({ status: 200, description: 'Agency details retrieved' })
  async getAgency(@Param('agencyId') agencyId: string) {
    try {
      return await this.enhancedAgencyService.getAgencyWithSwarmStatus(agencyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Agency not found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put(':agencyId')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Update agency configuration' })
  @ApiResponse({ status: 200, description: 'Agency updated successfully' })
  async updateAgency(
    @Param('agencyId') agencyId: string,
    @Body() updateAgencyDto: any
  ) {
    try {
      return await this.enhancedAgencyService.updateAgencyConfiguration(
        agencyId,
        updateAgencyDto
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update agency',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':agencyId/swarm/initialize')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Initialize swarm for agency' })
  @ApiResponse({ status: 200, description: 'Swarm initialized successfully' })
  async initializeSwarm(
    @Param('agencyId') agencyId: string,
    @Body() config?: any
  ) {
    try {
      return await this.enhancedAgencyService.initializeSwarm(agencyId, config);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize swarm',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId/swarm/status')
  @ApiOperation({ summary: 'Get current swarm status for agency' })
  @ApiResponse({ status: 200, description: 'Swarm status retrieved' })
  async getSwarmStatus(@Param('agencyId') agencyId: string) {
    try {
      return await this.enhancedAgencyService.getSwarmStatus(agencyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get swarm status',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post(':agencyId/providers/register')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Register service providers' })
  @ApiResponse({ status: 201, description: 'Providers registered successfully' })
  async registerProviders(
    @Param('agencyId') agencyId: string,
    @Body() providersDto: any
  ) {
    try {
      return await this.enhancedAgencyService.registerProviders(agencyId, providersDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to register providers',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId/providers')
  @ApiOperation({ summary: 'Get all service providers for agency' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getProviders(
    @Param('agencyId') agencyId: string,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: boolean
  ) {
    try {
      return await this.enhancedAgencyService.getProviders(agencyId, {
        categoryId,
        active
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get providers',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':agencyId/analytics')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Get agency performance analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '30d'
  ) {
    try {
      return await this.enhancedAgencyService.getAnalytics(agencyId, timeframe);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get analytics',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
