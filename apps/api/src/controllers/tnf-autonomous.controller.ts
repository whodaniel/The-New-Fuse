/**
 * TNF Autonomous System Controller
 *
 * REST API endpoints for managing the autonomous system:
 * - Director status and control
 * - BMAD cycle execution
 * - Agent swarm management
 * - System health and metrics
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  AgentSwarmProvider,
  BMADServiceProvider,
  DirectorServiceProvider,
} from '../modules/tnf-autonomous.module';

// DTOs
interface RegisterAgentDto {
  id: string;
  name: string;
  capabilities: string[];
}

interface ExecuteBMADCycleDto {
  skillIds: string[];
  contextPurpose: string;
  templateId: string;
  variables: Record<string, unknown>;
}

@Controller('autonomous')
export class TNFAutonomousController {
  private readonly logger = new Logger(TNFAutonomousController.name);

  constructor(
    private readonly director: DirectorServiceProvider,
    private readonly bmad: BMADServiceProvider,
    private readonly swarm: AgentSwarmProvider
  ) {}

  // ============================================================
  // SYSTEM STATUS
  // ============================================================

  /**
   * Get overall autonomous system status
   */
  @Get('status')
  async getSystemStatus() {
    return {
      success: true,
      data: {
        director: this.director.getStatus(),
        bmad: this.bmad.getStatistics(),
        swarm: this.swarm.getStatistics(),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Get system health
   */
  @Get('health')
  async getHealth() {
    const directorStatus = this.director.getStatus();
    const swarmStats = this.swarm.getStatistics();

    const isHealthy = directorStatus.isRunning && swarmStats.totalAgents >= 0;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        director: directorStatus.isRunning ? 'running' : 'stopped',
        swarm: swarmStats.onlineAgents > 0 ? 'agents_online' : 'no_agents',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // DIRECTOR CONTROL
  // ============================================================

  /**
   * Get director status
   */
  @Get('director/status')
  async getDirectorStatus() {
    return {
      success: true,
      data: this.director.getStatus(),
    };
  }

  /**
   * Start the director loop
   */
  @Post('director/start')
  @HttpCode(HttpStatus.OK)
  async startDirector() {
    await this.director.start();
    this.logger.log('Director started via API');
    return {
      success: true,
      message: 'Director loop started',
      data: this.director.getStatus(),
    };
  }

  /**
   * Stop the director loop
   */
  @Post('director/stop')
  @HttpCode(HttpStatus.OK)
  async stopDirector() {
    await this.director.stop();
    this.logger.log('Director stopped via API');
    return {
      success: true,
      message: 'Director loop stopped',
      data: this.director.getStatus(),
    };
  }

  // ============================================================
  // BMAD ORCHESTRATION
  // ============================================================

  /**
   * Get BMAD statistics
   */
  @Get('bmad/stats')
  async getBMADStats() {
    return {
      success: true,
      data: this.bmad.getStatistics(),
    };
  }

  /**
   * Execute a BMAD cycle
   */
  @Post('bmad/execute')
  @HttpCode(HttpStatus.OK)
  async executeBMADCycle(@Body() dto: ExecuteBMADCycleDto) {
    this.logger.log(`Executing BMAD cycle: ${dto.contextPurpose}`);

    const result = await this.bmad.executeBMADCycle({
      skillIds: dto.skillIds,
      contextPurpose: dto.contextPurpose,
      templateId: dto.templateId,
      variables: dto.variables,
    });

    return {
      success: true,
      message: 'BMAD cycle executed',
      data: result,
    };
  }

  /**
   * Register a new skill
   */
  @Post('bmad/skills')
  @HttpCode(HttpStatus.CREATED)
  async registerSkill(@Body() body: { id: string; skill: unknown }) {
    this.bmad.registerSkill(body.id, body.skill);

    return {
      success: true,
      message: `Skill ${body.id} registered`,
      data: this.bmad.getStatistics(),
    };
  }

  // ============================================================
  // AGENT SWARM
  // ============================================================

  /**
   * Get swarm statistics
   */
  @Get('swarm/stats')
  async getSwarmStats() {
    return {
      success: true,
      data: this.swarm.getStatistics(),
    };
  }

  /**
   * Register a new agent
   */
  @Post('swarm/agents')
  @HttpCode(HttpStatus.CREATED)
  async registerAgent(@Body() dto: RegisterAgentDto) {
    this.swarm.registerAgent({
      id: dto.id,
      name: dto.name,
      capabilities: dto.capabilities,
    });

    this.logger.log(`Agent registered: ${dto.name}`);

    return {
      success: true,
      message: `Agent ${dto.name} registered`,
      data: {
        agent: dto,
        swarmStats: this.swarm.getStatistics(),
      },
    };
  }

  /**
   * Unregister an agent
   */
  @Delete('swarm/agents/:id')
  async unregisterAgent(@Param('id') id: string) {
    this.swarm.unregisterAgent(id);
    this.logger.log(`Agent unregistered: ${id}`);

    return {
      success: true,
      message: `Agent ${id} unregistered`,
      data: this.swarm.getStatistics(),
    };
  }

  /**
   * Record agent heartbeat
   */
  @Post('swarm/agents/:id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async recordHeartbeat(@Param('id') id: string) {
    this.swarm.recordHeartbeat(id);

    return {
      success: true,
      message: `Heartbeat recorded for agent ${id}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find agents by capability
   */
  @Get('swarm/agents/capability/:capability')
  async findAgentsByCapability(@Param('capability') capability: string) {
    const agents = this.swarm.findAgentsByCapability(capability);

    return {
      success: true,
      data: {
        capability,
        agents,
        count: agents.length,
      },
    };
  }
}

export default TNFAutonomousController;
