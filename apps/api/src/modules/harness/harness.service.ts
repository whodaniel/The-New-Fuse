import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { CacheService } from '../../cache/cache.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class HarnessService {
  private readonly logger = new Logger(HarnessService.name);
  private readonly repoRoot: string;

  constructor(private readonly cache: CacheService) {
    this.repoRoot = path.resolve(process.cwd(), '../..');
  }

  private fleetModePath(): string {
    return path.join(os.homedir(), '.tnf', 'fleet', 'mode.json');
  }

  private harnessConfigPath(): string {
    return path.join(this.repoRoot, 'data/harness/harness-config.json');
  }

  private harnessCyclePath(): string {
    return path.join(this.repoRoot, 'docs/operations/tnf-harness-cycle.jsonl');
  }

  async getStatus() {
    const [config, fleetMode, lastCycle, alive, registry] = await Promise.all([
      this.readHarnessConfig(),
      this.readFleetMode(),
      this.readLastCycle(),
      this.cache.hgetall('tnf:alive:status'),
      this.cache.hgetall('tnf:agent-registry'),
    ]);

    const registryAgents = Object.entries(registry).map(([id, raw]) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { raw };
      }
      return {
        id,
        name: String(parsed.name ?? parsed.agentName ?? id),
        role: String(parsed.role ?? 'unknown'),
        status: String(parsed.status ?? 'unknown'),
        lastSeen: parsed.lastSeen ?? parsed.lastHeartbeat ?? null,
      };
    });

    return {
      timestamp: new Date().toISOString(),
      fleet: fleetMode,
      harness: config
        ? {
            version: config.version,
            role: config.role,
            layers: config.layers,
          }
        : null,
      relay: {
        alive: Object.keys(alive).length > 0 ? alive : null,
        registryCount: registryAgents.length,
        agents: registryAgents.slice(0, 50),
      },
      lastCycle,
      coLocatedNote:
        'Fleet mode and cycle logs reflect the API host filesystem. For cloud deployments, upload via TWIP bridge or run API co-located with the operator CLI.',
    };
  }

  async runInspect(): Promise<unknown> {
    const script = path.join(this.repoRoot, 'scripts/harness/verify-harness-completeness.cjs');
    try {
      const { stdout } = await execFileAsync('node', [script, '--json'], {
        cwd: this.repoRoot,
        timeout: 120_000,
        maxBuffer: 8 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch (err: any) {
      this.logger.warn(`Harness inspect failed: ${err?.message ?? err}`);
      throw err;
    }
  }

  private async readHarnessConfig(): Promise<Record<string, unknown> | null> {
    try {
      const raw = await fs.readFile(this.harnessConfigPath(), 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async readFleetMode(): Promise<Record<string, unknown>> {
    try {
      const raw = await fs.readFile(this.fleetModePath(), 'utf8');
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode ?? 'running',
        paused: parsed.mode === 'paused' || parsed.mode === 'injection-paused',
        reason: parsed.reason ?? '',
        updatedAt: parsed.updatedAt ?? null,
        updatedBy: parsed.updatedBy ?? null,
      };
    } catch {
      return { mode: 'running', paused: false, reason: '', updatedAt: null, updatedBy: null };
    }
  }

  private async readLastCycle(): Promise<Record<string, unknown> | null> {
    try {
      const raw = await fs.readFile(this.harnessCyclePath(), 'utf8');
      const lines = raw.trim().split('\n').filter(Boolean);
      if (!lines.length) return null;
      return JSON.parse(lines[lines.length - 1]);
    } catch {
      return null;
    }
  }
}
