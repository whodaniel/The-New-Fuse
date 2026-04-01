import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type JsonRecord = Record<string, unknown>;
type OpenClawRuntimeTargetOptions = {
  installationId?: string;
  instanceId?: string;
  stateDir?: string;
  allInstances?: boolean;
};

@Injectable()
export class OpenClawRuntimeService {
  private readonly repoRoot = this.resolveRepoRoot();
  private readonly scriptPath = path.join(
    this.repoRoot,
    'scripts',
    'openclaw',
    'tnf-openclaw-control.cjs'
  );

  async listInstances() {
    return this.runScript(['instances', '--json']);
  }

  async getInventory(target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript(['overview', '--json', ...this.buildTargetArgs(target)]);
  }

  async getConfig(pathExpression?: string, target: OpenClawRuntimeTargetOptions = {}) {
    const args = ['config-show', '--json'];
    if (pathExpression) args.push('--path', pathExpression);
    args.push(...this.buildTargetArgs(target));
    return this.runScript(args);
  }

  async setConfig(
    pathExpression: string,
    value: string,
    valueType = 'string',
    target: OpenClawRuntimeTargetOptions = {}
  ) {
    return this.runScript([
      'config-set',
      pathExpression,
      value,
      '--type',
      valueType || 'string',
      '--json',
      ...this.buildTargetArgs(target),
    ]);
  }

  async unsetConfig(pathExpression: string, target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript([
      'config-unset',
      pathExpression,
      '--json',
      ...this.buildTargetArgs(target),
    ]);
  }

  async listCronJobs(target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript(['cron-list', '--json', ...this.buildTargetArgs(target)]);
  }

  async enableCronJob(jobReference: string, target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript(['cron-enable', jobReference, '--json', ...this.buildTargetArgs(target)]);
  }

  async disableCronJob(jobReference: string, target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript([
      'cron-disable',
      jobReference,
      '--json',
      ...this.buildTargetArgs(target),
    ]);
  }

  async scheduleCronJob(
    jobReference: string,
    options: {
      cron?: string;
      tz?: string;
      staggerMs?: string | number;
      everyMs?: string | number;
      anchorMs?: string | number;
      at?: string;
    },
    target: OpenClawRuntimeTargetOptions = {}
  ) {
    const args = ['cron-schedule', jobReference, '--json'];
    if (options.cron) args.push('--cron', String(options.cron));
    if (options.tz) args.push('--tz', String(options.tz));
    if (options.staggerMs != null) args.push('--stagger-ms', String(options.staggerMs));
    if (options.everyMs != null) args.push('--every-ms', String(options.everyMs));
    if (options.anchorMs != null) args.push('--anchor-ms', String(options.anchorMs));
    if (options.at) args.push('--at', String(options.at));
    args.push(...this.buildTargetArgs(target));
    return this.runScript(args);
  }

  async syncControlPlane(actorId: string, target: OpenClawRuntimeTargetOptions = {}) {
    return this.runScript([
      'sync-control-plane',
      '--json',
      '--actor',
      actorId || 'system',
      ...this.buildTargetArgs(target),
    ]);
  }

  async cleanupCron(
    actorId: string,
    options: {
      dryRun?: boolean;
      disableFailing?: boolean;
      keepLaunchValidationDuplicates?: boolean;
    } & OpenClawRuntimeTargetOptions = {}
  ) {
    const args = ['cleanup-cron', '--json', '--actor', actorId || 'system'];
    if (options.dryRun) args.push('--dry-run');
    if (options.disableFailing) args.push('--disable-failing');
    if (options.keepLaunchValidationDuplicates) args.push('--keep-launch-validation-duplicates');
    args.push(...this.buildTargetArgs(options));
    return this.runScript(args);
  }

  private buildTargetArgs(target: OpenClawRuntimeTargetOptions): string[] {
    const args: string[] = [];
    if (target.allInstances) args.push('--all-instances');
    if (target.installationId) args.push('--installation', String(target.installationId));
    if (target.instanceId) args.push('--instance', String(target.instanceId));
    if (target.stateDir) args.push('--state-dir', String(target.stateDir));
    return args;
  }

  private async runScript(args: string[]): Promise<JsonRecord> {
    try {
      const { stdout } = await execFileAsync('node', [this.scriptPath, ...args], {
        cwd: this.repoRoot,
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 16,
      });
      return JSON.parse(String(stdout || '{}'));
    } catch (error) {
      const execError = error as Error & {
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      const stderr = String(execError.stderr || '').trim();
      const stdout = String(execError.stdout || '').trim();
      const errorPayload = [stderr, stdout]
        .filter(Boolean)
        .map((value: any) => {
          try {
            const parsed = JSON.parse(value);
            return String(parsed.error || parsed.message || value);
          } catch {
            return value;
          }
        })
        .find(Boolean);
      throw new Error(errorPayload || execError.message || 'OpenClaw runtime command failed');
    }
  }

  private resolveRepoRoot(): string {
    const registryRelative = path.join('data', 'protocols', 'cron-jobs.registry.json');
    let current = process.cwd();

    for (let i = 0; i < 8; i += 1) {
      const candidate = path.join(current, registryRelative);
      if (fs.existsSync(candidate)) return current;
      const next = path.dirname(current);
      if (next === current) break;
      current = next;
    }

    return process.cwd();
  }
}
