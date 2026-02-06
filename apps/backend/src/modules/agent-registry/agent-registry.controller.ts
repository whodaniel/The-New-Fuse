import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AgentDirectoryResponseDto,
  AgentInvitationResponseDto,
  AgentRegistrationReportDto,
  CreateAgentInvitationDto,
  AgentRegistrationResponseDto,
  RegisterAgentDto,
  SearchAgentsDto,
} from './dto';
import { drizzleAuditLogsRepository } from '@the-new-fuse/database';
import {
  AgentDirectoryService,
  AgentInvitationService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentRegistrationService,
  RateLimitService,
} from './services';

@ApiTags('Agent Registry')
@Controller('agent-registry')
export class AgentRegistryController {
  private readonly logger = new Logger(AgentRegistryController.name);

  constructor(
    private readonly registrationService: AgentRegistrationService,
    private readonly onboardingService: AgentOnboardingService,
    private readonly orientationService: AgentOrientationService,
    private readonly directoryService: AgentDirectoryService,
    private readonly invitationService: AgentInvitationService,
    private readonly rateLimitService: RateLimitService
  ) {}

  // ============================================================================
  // REGISTRATION ENDPOINTS
  // ============================================================================

  @Post('register')
  @ApiOperation({ summary: 'Register a new agent' })
  @ApiResponse({
    status: 201,
    description: 'Agent registered successfully',
    type: AgentRegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerAgent(
    @Body() data: RegisterAgentDto,
    @CurrentUser() user: any
  ): Promise<AgentRegistrationResponseDto> {
    this.logger.log(`Agent registration request: ${data.name}`);
    this.rateLimitService.consume(`agent-register:${data.invitationCode || 'none'}`, 15, 60_000);
    return this.registrationService.registerAgent(data, user?.id || 'system');
  }

  // ============================================================================
  // INVITATION ENDPOINTS (ADMIN)
  // ============================================================================

  @Post('invitations')
  @ApiOperation({ summary: 'Create an agent invitation code' })
  @ApiResponse({ status: 201, type: AgentInvitationResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createInvitation(
    @Body() body: CreateAgentInvitationDto,
    @CurrentUser() user: any
  ): Promise<AgentInvitationResponseDto> {
    const actorId = user?.id || 'system';
    this.rateLimitService.consume(`agent-invite:${actorId}`, 10, 60_000);

    const { invite, code } = await this.invitationService.createInvitation({
      code: body.code,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt,
      tenantId: body.tenantId,
      organizationId: body.organizationId,
      agencyId: body.agencyId,
      createdByUserId: user?.id,
      metadata: body.metadata || {},
    });

    return {
      id: invite.id,
      code,
      status: invite.status,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
      expiresAt: invite.expiresAt,
    };
  }

  @Post('invitations/:inviteId/revoke')
  @ApiOperation({ summary: 'Revoke an agent invitation code' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async revokeInvitation(@Param('inviteId') inviteId: string) {
    this.rateLimitService.consume(`agent-invite-revoke:${inviteId}`, 5, 60_000);
    const invite = await this.invitationService.revokeInvitation(inviteId);
    return { id: invite.id, status: invite.status, usedCount: invite.usedCount };
  }

  @Get('registration/:id')
  @ApiOperation({ summary: 'Get registration details' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async getRegistration(@Param('id') id: string, @Headers('x-agent-token') token: string) {
    await this.verifyAgentToken(token);
    return this.registrationService.getRegistration(id, 'system');
  }

  @Get('registrations/reporting')
  @ApiOperation({ summary: 'Query registrations by protocol metadata (admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getRegistrationsByProtocol(
    @Query('tenantId') tenantId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('agencyId') agencyId?: string,
    @Query('trustTier') trustTier?: string,
    @Query('inviteId') inviteId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<AgentRegistrationReportDto[]> {
    this.rateLimitService.consume(`agent-reporting:${tenantId || 'all'}`, 30, 60_000);
    const results = await this.registrationService.getRegistrationsByProtocol({
      tenantId,
      organizationId,
      agencyId,
      trustTier,
      inviteId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return results as AgentRegistrationReportDto[];
  }

  @Get('registrations/integrity')
  @ApiOperation({ summary: 'Validate registration integrity (admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async validateRegistrationIntegrity() {
    this.rateLimitService.consume('agent-integrity-check', 10, 60_000);
    try {
      const result = await this.registrationService.validateRegistrationIntegrity();
      await drizzleAuditLogsRepository.create({
        action: 'agent.registration.integrity_checked',
        resourceType: 'agent_registration',
        status: 'success',
        details: result,
      });
      return result;
    } catch (error) {
      await drizzleAuditLogsRepository.create({
        action: 'agent.registration.integrity_checked',
        resourceType: 'agent_registration',
        status: 'failure',
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send agent heartbeat' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async sendHeartbeat(@Headers('x-agent-token') token: string) {
    const { registrationId } = await this.verifyAgentToken(token);
    await this.registrationService.updateHeartbeat(registrationId);
    return { status: 'ok', timestamp: new Date() };
  }

  // ============================================================================
  // ONBOARDING ENDPOINTS
  // ============================================================================

  @Post('onboarding/:registrationId/start')
  @ApiOperation({ summary: 'Start onboarding process' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async startOnboarding(
    @Param('registrationId') registrationId: string,
    @Headers('x-agent-token') token: string
  ) {
    await this.verifyAgentToken(token);
    this.rateLimitService.consume(`agent-onboarding-start:${registrationId}`, 30, 60_000);
    return this.onboardingService.startOnboarding(registrationId);
  }

  @Post('onboarding/:registrationId/test-capabilities')
  @ApiOperation({ summary: 'Test agent capabilities' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async testCapabilities(
    @Param('registrationId') registrationId: string,
    @Headers('x-agent-token') token: string
  ) {
    await this.verifyAgentToken(token);
    this.rateLimitService.consume(`agent-onboarding-test:${registrationId}`, 20, 60_000);
    return this.onboardingService.testCapabilities(registrationId);
  }

  @Post('onboarding/:registrationId/complete-step')
  @ApiOperation({ summary: 'Complete an onboarding step' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async completeOnboardingStep(
    @Param('registrationId') registrationId: string,
    @Body() body: { stepId: string; data?: any },
    @Headers('x-agent-token') token: string
  ) {
    await this.verifyAgentToken(token);
    this.rateLimitService.consume(`agent-onboarding-step:${registrationId}:${body.stepId}`, 60, 60_000);
    return this.onboardingService.completeStep(registrationId, body.stepId, body.data);
  }

  @Get('onboarding/:registrationId/progress')
  @ApiOperation({ summary: 'Get onboarding progress' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async getOnboardingProgress(
    @Param('registrationId') registrationId: string,
    @Headers('x-agent-token') token: string
  ) {
    await this.verifyAgentToken(token);
    return this.onboardingService.getOnboardingProgress(registrationId);
  }

  // ============================================================================
  // ORIENTATION ENDPOINTS
  // ============================================================================

  @Get('orientation/steps')
  @ApiOperation({ summary: 'Get all orientation steps' })
  getOrientationSteps() {
    return this.orientationService.getOrientationSteps();
  }

  @Get('orientation/steps/:stepId')
  @ApiOperation({ summary: 'Get a specific orientation step' })
  getOrientationStep(@Param('stepId') stepId: string) {
    return this.orientationService.getOrientationStep(stepId);
  }

  @Get('orientation/summary')
  @ApiOperation({ summary: 'Get orientation summary' })
  getOrientationSummary() {
    return this.orientationService.getOrientationSummary();
  }

  // ============================================================================
  // DIRECTORY ENDPOINTS
  // ============================================================================

  @Get('directory')
  @ApiOperation({ summary: 'Search agents in directory' })
  @ApiResponse({ status: 200, type: AgentDirectoryResponseDto })
  async searchAgents(@Query() query: SearchAgentsDto): Promise<AgentDirectoryResponseDto> {
    return this.directoryService.searchAgents(query);
  }

  @Get('directory/featured')
  @ApiOperation({ summary: 'Get featured agents' })
  async getFeaturedAgents(@Query('limit') limit?: number) {
    return this.directoryService.getFeaturedAgents(limit ? Number(limit) : 10);
  }

  @Get('directory/stats')
  @ApiOperation({ summary: 'Get directory statistics' })
  async getDirectoryStats() {
    return this.directoryService.getDirectoryStats();
  }

  @Get('directory/:agentId')
  @ApiOperation({ summary: 'Get agent details from directory' })
  async getAgentDetails(@Param('agentId') agentId: string) {
    return this.directoryService.getAgentDetails(agentId);
  }

  @Get('directory/:agentId/capabilities')
  @ApiOperation({ summary: 'Get agent capabilities' })
  async getAgentCapabilities(@Param('agentId') agentId: string) {
    const details = await this.directoryService.getAgentDetails(agentId);
    return {
      agentId,
      capabilities: details?.capabilities || [],
    };
  }

  // ============================================================================
  // METRICS ENDPOINTS
  // ============================================================================

  @Post('metrics')
  @ApiOperation({ summary: 'Record agent metric' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async recordMetric(
    @Headers('x-agent-token') token: string,
    @Body() body: { type: string; value: number; unit?: string; tags?: any }
  ) {
    const { registrationId } = await this.verifyAgentToken(token);
    await this.directoryService.recordMetric(registrationId, body);
    return { status: 'recorded' };
  }

  @Get('metrics/:registrationId')
  @ApiOperation({ summary: 'Get agent metrics' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async getMetrics(
    @Param('registrationId') registrationId: string,
    @Headers('x-agent-token') token: string,
    @Query('type') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    await this.verifyAgentToken(token);
    return this.directoryService.getAgentMetrics(
      registrationId,
      metricType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async verifyAgentToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Agent token required');
    }
    return this.registrationService.verifyAuthToken(token);
  }
}
