/**
 * Orchestrator Controller
 *
 * REST API endpoints for the TNF orchestration system.
 * Allows agents to register, send heartbeats, and check system health.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { AgentInvitationService, RateLimitService } from '../agent-registry/services';

interface RegisterAgentDto {
  agentId: string;
  agentName?: string;
  agentType?: string;
  expectedResponseTimeMs?: number;
  capabilities?: string[];
  invitationCode?: string;
  tenantId?: string;
  organizationId?: string;
  agencyId?: string;
  identity?: Record<string, unknown>;
  trust?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface HeartbeatDto {
  agentId: string;
  taskId?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityDto {
  agentId: string;
  activityType: string;
  metadata?: Record<string, unknown>;
}

interface HandoffDto {
  agentId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger('OrchestratorController');

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly invitationService: AgentInvitationService,
    private readonly rateLimitService: RateLimitService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health and agent metrics' })
  @ApiResponse({ status: 200, description: 'System health metrics' })
  getSystemHealth() {
    const health = this.orchestratorService.getSystemHealth();
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      metrics: health || {
        totalAgents: 0,
        activeAgents: 0,
        stalledAgents: 0,
        failedAgents: 0,
      },
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new agent for heartbeat monitoring' })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  async registerAgent(@Body() dto: RegisterAgentDto) {
    this.logger.log(`📝 Registering agent: ${dto.agentId} (${dto.agentName || 'unnamed'})`);

    this.rateLimitService.consume(`orchestrator-register:${dto.agentId}`, 30, 60_000);

    const inviteRequired = process.env.AGENT_INVITE_REQUIRED !== 'false';
    const requireTenantScope = process.env.A2A_REQUIRE_TENANT_SCOPE !== 'false';
    if (inviteRequired || requireTenantScope) {
      if (!dto.tenantId && !dto.organizationId && !dto.agencyId) {
        throw new BadRequestException(
          'tenantId, organizationId, or agencyId is required for orchestrator registration'
        );
      }
    }

    if (inviteRequired) {
      await this.invitationService.validateInvitation(dto.invitationCode || '', {
        tenantId: dto.tenantId,
        organizationId: dto.organizationId,
        agencyId: dto.agencyId,
      });
    }

    this.orchestratorService.registerAgent(dto.agentId, dto.expectedResponseTimeMs, {
      agentName: dto.agentName,
      agentType: dto.agentType,
      capabilities: dto.capabilities || [],
      tenantId: dto.tenantId,
      organizationId: dto.organizationId,
      agencyId: dto.agencyId,
      identity: dto.identity,
      trust: dto.trust,
      ...dto.metadata,
    });

    return {
      success: true,
      message: `Agent ${dto.agentId} registered successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a heartbeat from an agent' })
  @ApiResponse({ status: 200, description: 'Heartbeat recorded' })
  recordHeartbeat(@Body() dto: HeartbeatDto) {
    this.orchestratorService.recordAgentHeartbeat(dto.agentId, dto.taskId);
    if (dto.status || dto.metadata) {
      this.orchestratorService.recordAgentActivity(dto.agentId, dto.status || 'heartbeat', {
        ...dto.metadata,
        taskId: dto.taskId,
      });
    }

    return {
      success: true,
      received: new Date().toISOString(),
    };
  }

  @Post('activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record agent activity' })
  @ApiResponse({ status: 200, description: 'Activity recorded' })
  recordActivity(@Body() dto: ActivityDto) {
    this.orchestratorService.recordAgentActivity(dto.agentId, dto.activityType, dto.metadata);
    return {
      success: true,
      received: new Date().toISOString(),
    };
  }

  @Post('handoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record agent handoff summary' })
  @ApiResponse({ status: 200, description: 'Handoff recorded' })
  recordHandoff(@Body() dto: HandoffDto) {
    this.orchestratorService.recordAgentHandoff(dto.agentId, dto.summary, dto.metadata);
    return {
      success: true,
      received: new Date().toISOString(),
    };
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all registered agents and their status' })
  @ApiResponse({ status: 200, description: 'List of all agents' })
  getAllAgents() {
    const heartbeatService = this.orchestratorService.getHeartbeatService();

    if (!heartbeatService) {
      return { agents: [], message: 'Heartbeat service not initialized' };
    }

    const agentMap = heartbeatService.getAllAgentStatuses();
    const agents = Array.from(agentMap.values()).map((agent) => ({
      agentId: agent.agentId,
      status: agent.status,
      lastHeartbeat: agent.lastHeartbeat.toISOString(),
      lastActivity: agent.lastActivity.toISOString(),
      currentTask: agent.currentTask,
      consecutiveFailures: agent.consecutiveFailures,
    }));

    return { agents, count: agents.length };
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: 'Get status of a specific agent' })
  @ApiResponse({ status: 200, description: 'Agent status' })
  getAgentStatus(@Param('agentId') agentId: string) {
    const heartbeatService = this.orchestratorService.getHeartbeatService();

    if (!heartbeatService) {
      return { error: 'Heartbeat service not initialized' };
    }

    const status = heartbeatService.getAgentStatus(agentId);

    if (!status) {
      return { error: `Agent ${agentId} not found` };
    }

    return {
      agentId: status.agentId,
      status: status.status,
      lastHeartbeat: status.lastHeartbeat.toISOString(),
      lastActivity: status.lastActivity.toISOString(),
      currentTask: status.currentTask,
      consecutiveFailures: status.consecutiveFailures,
    };
  }

  @Get('tnf-status')
  @ApiOperation({ summary: 'Get TNF Core Agent status (The New Fuse as Master Agent)' })
  @ApiResponse({ status: 200, description: 'TNF Core status' })
  getTNFStatus() {
    const heartbeatService = this.orchestratorService.getHeartbeatService();
    const tnfStatus = heartbeatService?.getAgentStatus('tnf-core');
    const health = this.orchestratorService.getSystemHealth();

    return {
      identity: 'TNF Core - The New Fuse Master Agent',
      description: 'TNF is the primary agent that orchestrates all other agents in the ecosystem',
      status: tnfStatus?.status || 'unknown',
      lastHeartbeat: tnfStatus?.lastHeartbeat?.toISOString(),
      systemHealth: health,
      capabilities: [
        'agent_orchestration',
        'heartbeat_monitoring',
        'task_coordination',
        'stagnation_detection',
        'escalation_handling',
        'handoff_protocols',
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
