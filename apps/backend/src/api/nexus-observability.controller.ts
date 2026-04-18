import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { OrchestratorService } from '../modules/orchestrator/index.js';
import { SystemMetricsService } from '../modules/system-metrics/system-metrics.service.js';

type AgentStatusPayload = {
  agentId: string;
  status: string;
  lastHeartbeat: string;
  lastActivity: string;
  currentTask?: string;
  consecutiveFailures?: number;
};

@Controller('api')
export class NexusObservabilityController {
  private readonly logger = new Logger(NexusObservabilityController.name);

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly systemMetricsService: SystemMetricsService
  ) {}

  @Get('orchestrator/health')
  getOrchestratorHealth() {
    const metrics = this.orchestratorService.getSystemHealth();
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      metrics: metrics || {
        totalAgents: 0,
        activeAgents: 0,
        stalledAgents: 0,
        failedAgents: 0,
      },
    };
  }

  @Get('orchestrator/agents')
  getOrchestratorAgents() {
    const heartbeatService = this.orchestratorService.getHeartbeatService();
    if (!heartbeatService) {
      return {
        agents: [],
        count: 0,
        message: 'Heartbeat service not initialized',
      };
    }

    const agents: AgentStatusPayload[] = Array.from(heartbeatService.getAllAgentStatuses().values())
      .map((agent) => ({
        agentId: agent.agentId,
        status: agent.status,
        lastHeartbeat: agent.lastHeartbeat.toISOString(),
        lastActivity: agent.lastActivity.toISOString(),
        currentTask: agent.currentTask,
        consecutiveFailures: agent.consecutiveFailures,
      }))
      .sort((a, b) => a.agentId.localeCompare(b.agentId));

    return { agents, count: agents.length };
  }

  @Get('system/health')
  async getSystemHealth() {
    try {
      const health = await this.systemMetricsService.getHealthCheck();
      const metrics = await this.systemMetricsService.getMetrics();
      const serviceStatuses = new Map(
        (metrics.services || []).map((service) => [service.name, service.status])
      );

      return {
        status: health.status,
        timestamp:
          health.timestamp instanceof Date
            ? health.timestamp.toISOString()
            : new Date(health.timestamp).toISOString(),
        uptime: health.uptime,
        version: metrics.version || process.version,
        environment: metrics.environment || process.env.NODE_ENV || 'development',
        services: {
          api: 'online',
          database: serviceStatuses.get('database') === 'healthy' ? 'online' : 'offline',
          filesystem: serviceStatuses.get('storage') === 'healthy' ? 'online' : 'unknown',
          memory: metrics.memory?.usagePercent < 95 ? 'healthy' : 'warning',
        },
      };
    } catch (error) {
      this.logger.error(`System health compatibility endpoint failed: ${String(error)}`);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.version,
        environment: process.env.NODE_ENV || 'development',
        services: {
          api: 'online',
          database: 'offline',
          filesystem: 'unknown',
          memory: 'unknown',
        },
        error: 'Health check failed',
      };
    }
  }

  @Get('system/status')
  async getSystemStatus() {
    try {
      const metrics = await this.systemMetricsService.getMetrics();
      const serviceStatuses = new Map(
        (metrics.services || []).map((service) => [service.name, service.status])
      );
      return {
        api: 'online',
        database: serviceStatuses.get('database') === 'healthy' ? 'online' : 'offline',
        redis: serviceStatuses.get('redis') === 'healthy' ? 'online' : 'offline',
        filesystem: serviceStatuses.get('storage') === 'healthy' ? 'online' : 'unknown',
        status: metrics.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`System status compatibility endpoint failed: ${String(error)}`);
      throw new InternalServerErrorException('Failed to get system status');
    }
  }

  @Get('visualizations/data/graph-artifacts.index.json')
  async getGraphArtifactsIndex() {
    const envPath = process.env.GRAPH_ARTIFACTS_INDEX_PATH?.trim();
    const candidateRoots = [
      process.cwd(),
      __dirname,
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../..'),
      path.resolve(__dirname, '../../..'),
      path.resolve(__dirname, '../../../..'),
      path.resolve(__dirname, '../../../../..'),
    ];
    const relativeCandidates = [
      'apps/frontend/public/visualizations/data/graph-artifacts.index.json',
      'apps/frontend/dist/visualizations/data/graph-artifacts.index.json',
      'frontend/public/visualizations/data/graph-artifacts.index.json',
      'frontend/dist/visualizations/data/graph-artifacts.index.json',
      'public/visualizations/data/graph-artifacts.index.json',
      'visualizations/data/graph-artifacts.index.json',
    ];

    const candidates = new Set<string>();
    if (envPath) {
      candidates.add(path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath));
    }

    for (const root of candidateRoots) {
      for (const relative of relativeCandidates) {
        candidates.add(path.resolve(root, relative));
      }
    }

    for (const candidate of candidates) {
      try {
        const raw = await fs.readFile(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          servedFrom: candidate,
        };
      } catch {
        // Continue probing candidates.
      }
    }

    throw new NotFoundException(
      'Graph artifacts index not found. Run `pnpm run viz:graph:publish` and redeploy.'
    );
  }
}
