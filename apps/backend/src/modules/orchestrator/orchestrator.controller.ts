/**
 * Orchestrator Controller
 *
 * REST API endpoints for the TNF orchestration system.
 * Allows agents to register, send heartbeats, and check system health.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrchestratorModule } from './orchestrator.module';

interface RegisterAgentDto {
  agentId: string;
  agentName?: string;
  agentType?: string;
  expectedResponseTimeMs?: number;
  capabilities?: string[];
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

@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger('OrchestratorController');

  constructor(private readonly orchestratorModule: OrchestratorModule) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health and agent metrics' })
  @ApiResponse({ status: 200, description: 'System health metrics' })
  getSystemHealth() {
    const health = this.orchestratorModule.getSystemHealth();
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
  registerAgent(@Body() dto: RegisterAgentDto) {
    this.logger.log(`📝 Registering agent: ${dto.agentId} (${dto.agentName || 'unnamed'})`);

    this.orchestratorModule.registerAgent(dto.agentId, dto.expectedResponseTimeMs);

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
    this.orchestratorModule.recordAgentHeartbeat(dto.agentId, dto.taskId);

    return {
      success: true,
      received: new Date().toISOString(),
    };
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all registered agents and their status' })
  @ApiResponse({ status: 200, description: 'List of all agents' })
  getAllAgents() {
    const heartbeatService = this.orchestratorModule.getHeartbeatService();

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
    const heartbeatService = this.orchestratorModule.getHeartbeatService();

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
    const heartbeatService = this.orchestratorModule.getHeartbeatService();
    const tnfStatus = heartbeatService?.getAgentStatus('tnf-core');
    const health = this.orchestratorModule.getSystemHealth();

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
