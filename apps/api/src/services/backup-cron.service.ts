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
export class BackupCronService {
  private readonly logger = new Logger(BackupCronService.name);
  private scriptPath: string;
  private repoRoot: string;

  constructor() {
    this.repoRoot = path.resolve(__dirname, '../../../..');
    this.scriptPath = path.join(this.repoRoot, 'scripts', 'autonomy', 'tnf_backup_cron.py');
    if (!fs.existsSync(this.scriptPath)) {
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
  }

  private async runPythonScript(args: string[]): Promise<string> {
    const { stdout, stderr } = await execFileAsync('python3', [this.scriptPath, ...args], {
      cwd: this.repoRoot,
      maxBuffer: 1024 * 1024 * 10,
      timeout: 120_000,
    });
    if (stderr) this.logger.warn(`backup cron stderr: ${stderr}`);
    return String(stdout || '').trim();
  }

  async getStorageInventory(): Promise<StorageInventory> {
    return JSON.parse(await this.runPythonScript(['--inventory']));
  }

  async listBackups(): Promise<BackupSnapshot[]> {
    return JSON.parse(await this.runPythonScript(['--list-backups']));
  }

  async executeBackup(): Promise<BackupResult> {
    return JSON.parse(await this.runPythonScript(['--execute-backup']));
  }

  async getConfig(): Promise<BackupConfig> {
    const data = JSON.parse(await this.runPythonScript([]));
    return data.config;
  }

  async updateDestination(destination: string): Promise<void> {
    await this.runPythonScript(['--set-dest', destination]);
  }

  async updateCronExpression(expression: string): Promise<void> {
    await this.runPythonScript(['--set-cron', expression]);
  }

  async enableCron(): Promise<string> {
    return this.runPythonScript(['--enable-cron']);
  }

  async disableCron(): Promise<string> {
    return this.runPythonScript(['--disable-cron']);
  }

  async syncCron(): Promise<string> {
    return this.runPythonScript(['--sync-cron']);
  }

  async getFullStatus() {
    const [inventory, backups, config] = await Promise.all([
      this.getStorageInventory(),
      this.listBackups(),
      this.getConfig(),
    ]);
    return { inventory, backups, config };
  }
}
