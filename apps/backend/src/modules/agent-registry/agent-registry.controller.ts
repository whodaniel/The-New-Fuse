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
} from './dto';
import {
  AgentDirectoryService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentRegistrationService,
} from './services';

@ApiTags('Agent Registry')
@Controller('agent-registry')
export class AgentRegistryController {
  private readonly logger = new Logger(AgentRegistryController.name);

  constructor(
    private readonly registrationService: AgentRegistrationService,
    private readonly onboardingService: AgentOnboardingService,
    private readonly orientationService: AgentOrientationService,
    private readonly directoryService: AgentDirectoryService
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
    return this.registrationService.getRegistration(id, 'system');
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
  // HELPER METHODS
  // ============================================================================

  private async verifyAgentToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Agent token required');
    }
    return this.registrationService.verifyAuthToken(token);
  }
}
