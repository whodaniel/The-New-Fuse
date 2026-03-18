import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  AgentDirectoryResponseDto,
  AgentRegistrationResponseDto,
  RegisterAgentDto,
  SearchAgentsDto,
  TraitScreenRequestDto,
} from './dto';
import {
  AgentDirectoryService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentProfileVectorService,
  AgentRegistrationService,
  AgentRegistryImportService,
} from './services';

@ApiTags('Agent Registry')
@Controller('api/agent-registry')
export class AgentRegistryController {
  private readonly logger = new Logger(AgentRegistryController.name);

  constructor(
    private readonly registrationService: AgentRegistrationService,
    private readonly onboardingService: AgentOnboardingService,
    private readonly orientationService: AgentOrientationService,
    private readonly directoryService: AgentDirectoryService,
    private readonly traitVectorService: AgentProfileVectorService,
    private readonly importService: AgentRegistryImportService
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
    return this.registrationService.registerAgent(data, user?.id || 'system');
  }

  @Get('registration/:id')
  @ApiOperation({ summary: 'Get registration details' })
  @ApiHeader({ name: 'X-Agent-Token', description: 'Agent authentication token' })
  async getRegistration(@Param('id') id: string, @Headers('x-agent-token') token: string) {
    await this.verifyAgentToken(token);
    return this.registrationService.getRegistration(id);
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
  // REGISTRY IMPORT ENDPOINTS
  // ============================================================================

  @Post('import/snapshot')
  @ApiOperation({ summary: 'Import agent registry snapshot' })
  @ApiHeader({ name: 'X-Admin-Token', required: false, description: 'Import token' })
  async importSnapshot(
    @Body() body: { snapshotPath?: string; onlyType?: string },
    @Headers('x-admin-token') token: string,
    @Query('token') tokenQuery?: string
  ) {
    this.verifyImportToken(token || tokenQuery);
    return this.importService.importSnapshot(body?.snapshotPath, body?.onlyType);
  }

  @Get('import/snapshot')
  @ApiOperation({ summary: 'Import agent registry snapshot (cron-friendly)' })
  @ApiHeader({ name: 'X-Admin-Token', required: false, description: 'Import token' })
  async importSnapshotCron(
    @Query('snapshotPath') snapshotPath?: string,
    @Query('onlyType') onlyType?: string,
    @Headers('x-admin-token') token?: string,
    @Query('token') tokenQuery?: string
  ) {
    this.verifyImportToken(token || tokenQuery);
    return this.importService.importSnapshot(snapshotPath, onlyType);
  }

  // ============================================================================
  // TRAIT-RAG SCREENING ENDPOINTS
  // ============================================================================

  @Post('traits/reindex')
  @ApiOperation({
    summary:
      'Rebuild agent profile vectors from tnf_agent_definitions (all rows or provided tnfIds)',
  })
  async reindexTraitProfiles(@Body() body?: { tnfIds?: string[] }) {
    const requestedIds = Array.isArray(body?.tnfIds) ? body?.tnfIds : [];
    if (requestedIds.length > 0) {
      return this.traitVectorService.reindexByTnfIds(requestedIds);
    }
    return this.traitVectorService.reindexAllAgentProfiles();
  }

  @Post('traits/screen')
  @ApiOperation({
    summary:
      'Run inquiry through trait/profile vector screen before downstream resource or asset retrieval',
  })
  async screenInquiryByTraits(@Body() body: TraitScreenRequestDto) {
    return this.traitVectorService.screenInquiry(body);
  }

  @Get('traits/stats')
  @ApiOperation({ summary: 'Get trait/profile vector index statistics' })
  async getTraitVectorStats() {
    return this.traitVectorService.getStats();
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

  private verifyImportToken(token?: string) {
    const expected = process.env.AGENT_REGISTRY_IMPORT_TOKEN;
    if (!expected) return;
    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid import token');
    }
  }
}
