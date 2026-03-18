import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('system')
@ApiTags('system')
export class SystemGatewayController {
  constructor(private readonly proxyService: ProxyService) {}
  private readonly projectedSuperCycleContract = [
    { processId: 'tnf-heartbeat-pulse', name: 'Heartbeat Pulse', cadenceSeconds: 3 },
    { processId: 'tnf-broker-sweep', name: 'Broker Sweep', cadenceSeconds: 15 },
    { processId: 'tnf-director-cycle', name: 'Director Cycle', cadenceSeconds: 30 },
    { processId: 'tnf-audit-trail-sync', name: 'Audit Trail Sync', cadenceSeconds: 45 },
    { processId: 'tnf-graph-refresh', name: 'Graph Refresh', cadenceSeconds: 90 },
  ] as const;

  private normalizeMasterClockPayload(payload: any) {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const superCycle = payload.superCycle;
    if (!superCycle || typeof superCycle !== 'object') {
      return payload;
    }

    const processes = Array.isArray(superCycle.processes) ? superCycle.processes : [];
    const hasProjectionMode = typeof superCycle.projectionMode === 'string';

    if (processes.length > 0 || hasProjectionMode) {
      return payload;
    }

    const now = Date.now();
    const staleThresholdMs = this.parsePositiveInt(superCycle.staleThresholdMs, 90000);
    const orchestratorHeartbeatMs = this.toTimestampMs(payload?.orchestrator?.lastHeartbeat);
    const superCycleLastUpdatedMs = this.toTimestampMs(superCycle?.lastUpdated);
    const referenceMs = orchestratorHeartbeatMs || superCycleLastUpdatedMs || now;
    const projectedProcesses = this.buildProjectedSuperCycleProcesses(
      now,
      staleThresholdMs,
      referenceMs
    );
    const stats = this.buildProcessStats(projectedProcesses);

    return {
      ...payload,
      superCycle: {
        ...superCycle,
        projectionMode: 'contract-fallback',
        staleThresholdMs,
        stats,
        processes: projectedProcesses,
      },
    };
  }

  private toTimestampMs(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private parsePositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private buildProcessStats(processes: Array<{ status: string }>) {
    const healthy = processes.filter((process) => process.status === 'healthy').length;
    const stale = processes.filter((process) => process.status === 'stale').length;
    return { total: processes.length, healthy, stale };
  }

  private buildProjectedSuperCycleProcesses(
    now: number,
    staleThresholdMs: number,
    referenceMs: number
  ) {
    return this.projectedSuperCycleContract.map((definition) => {
      const expectedIntervalMs = definition.cadenceSeconds * 1000;
      const ageMs = Math.max(0, now - referenceMs);
      const status = ageMs > staleThresholdMs ? 'stale' : 'healthy';
      const nextExpectedAt = new Date(referenceMs + expectedIntervalMs).toISOString();
      const timestamp = new Date(referenceMs).toISOString();

      return {
        processId: definition.processId,
        name: definition.name,
        status,
        health: status,
        lastSeenAt: timestamp,
        lastRunAt: timestamp,
        nextExpectedAt,
        expectedIntervalMs,
        ageMs,
        metadata: {
          projected: true,
          projectionSource: 'api-gateway',
          cadenceSeconds: definition.cadenceSeconds,
        },
      };
    });
  }

  private async proxyMasterClock(headers: Record<string, string>, res: Response) {
    const upstreams = [
      { service: 'agents', path: '/api/system/master-clock' },
      { service: 'api', path: '/api/system/master-clock' },
      { service: 'backend', path: '/api/system/master-clock' },
      { service: 'backend', path: '/system/master-clock' },
    ] as const;

    let lastFailure = 'No upstreams responded';

    for (const upstream of upstreams) {
      try {
        const response = await this.proxyService.proxyRequest(
          upstream.service,
          upstream.path,
          'GET',
          headers
        );

        if (response.status >= 200 && response.status < 300) {
          const normalized = this.normalizeMasterClockPayload(response.data);
          return res.status(response.status).json(normalized);
        }

        lastFailure = `${upstream.service} returned ${response.status}`;
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return res.status(HttpStatus.BAD_GATEWAY).json({
      message: 'System telemetry service unavailable',
      error: lastFailure,
    });
  }

  // Legacy path: /api/system/master-clock
  @Get('master-clock')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Get Master Clock telemetry (legacy path)' })
  @ApiResponse({ status: 200, description: 'Master Clock telemetry retrieved successfully' })
  async getMasterClockLegacy(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyMasterClock(headers, res);
  }

  // Versioned path: /api/v1/system/master-clock
  @Get('master-clock')
  @Version('1')
  @ApiOperation({ summary: 'Get Master Clock telemetry' })
  @ApiResponse({ status: 200, description: 'Master Clock telemetry retrieved successfully' })
  async getMasterClockV1(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyMasterClock(headers, res);
  }
}
