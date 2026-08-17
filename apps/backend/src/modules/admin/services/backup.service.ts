import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface StorageInventory {
  timestamp: string;
  total_storage_bytes: number;
  total_storage_formatted: string;
  inventory: StorageItem[];
}

export interface StorageItem {
  id: string;
  name: string;
  description: string;
  path: string;
  alt_path: string;
  classification: string;
  git_status: string;
  size_bytes: number;
  size_formatted: string;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  path: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export interface BackupConfig {
  backup_destination: string;
  schedule: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time: string;
    cron_expression: string;
  };
  retention: {
    keep_last_snapshots: number;
    compress_format: string;
  };
  included_targets: string[];
}

export interface BackupResult {
  id: string;
  filename: string;
  path: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
  status: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly scriptPath: string;
  private readonly repoRoot: string;

  constructor() {
    // apps/backend/src/modules/admin/services → repo root is five levels up
    this.repoRoot = path.resolve(__dirname, '../../../../..');
    this.scriptPath = path.join(this.repoRoot, 'scripts', 'autonomy', 'tnf_backup_cron.py');
    if (!fs.existsSync(this.scriptPath)) {
      // Dist builds may nest differently; walk up looking for the script.
      let cursor = path.resolve(__dirname);
      for (let i = 0; i < 8; i++) {
        const candidate = path.join(cursor, 'scripts', 'autonomy', 'tnf_backup_cron.py');
        if (fs.existsSync(candidate)) {
          this.scriptPath = candidate;
          this.repoRoot = cursor;
          break;
        }
        cursor = path.dirname(cursor);
      }
    }
    this.logger.log(`Backup script path: ${this.scriptPath}`);
    this.logger.log(`Repo root: ${this.repoRoot}`);
  }

  private async runPythonScript(args: string[]): Promise<string> {
    this.logger.debug(`Executing: python3 ${this.scriptPath} ${args.join(' ')}`);
    try {
      const { stdout, stderr } = await execFileAsync('python3', [this.scriptPath, ...args], {
        cwd: this.repoRoot,
        maxBuffer: 1024 * 1024 * 10,
        timeout: 120_000,
      });
      if (stderr) {
        this.logger.warn(`Python script stderr: ${stderr}`);
      }
      return String(stdout || '').trim();
    } catch (error: any) {
      this.logger.error(`Failed to execute backup script: ${error.message}`);
      if (error.stdout) this.logger.error(`stdout: ${error.stdout}`);
      if (error.stderr) this.logger.error(`stderr: ${error.stderr}`);
      throw new Error(`Backup script execution failed: ${error.message}`);
    }
  }

  async getStorageInventory(): Promise<StorageInventory> {
    const output = await this.runPythonScript(['--inventory']);
    return JSON.parse(output);
  }

  async listBackups(): Promise<BackupSnapshot[]> {
    const output = await this.runPythonScript(['--list-backups']);
    return JSON.parse(output);
  }

  async executeBackup(): Promise<BackupResult> {
    const output = await this.runPythonScript(['--execute-backup']);
    return JSON.parse(output);
  }

  async getConfig(): Promise<BackupConfig> {
    const output = await this.runPythonScript([]);
    const data = JSON.parse(output);
    return data.config;
  }

  async updateDestination(destination: string): Promise<void> {
    await this.runPythonScript(['--set-dest', destination]);
  }

  async updateCronExpression(expression: string): Promise<void> {
    await this.runPythonScript(['--set-cron', expression]);
  }

  async enableCron(): Promise<string> {
    const output = await this.runPythonScript(['--enable-cron']);
    return output;
  }

  async disableCron(): Promise<string> {
    const output = await this.runPythonScript(['--disable-cron']);
    return output;
  }

  async syncCron(): Promise<string> {
    const output = await this.runPythonScript(['--sync-cron']);
    return output;
  }

  async getFullStatus() {
    const [inventory, backups, config] = await Promise.all([
      this.getStorageInventory(),
      this.listBackups(),
      this.getConfig(),
    ]);

    return {
      inventory,
      backups,
      config,
    };
  }
}
