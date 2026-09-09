import * as fs from 'fs';
import * as path from 'path';
import {
  accountOwnedStamp,
  mergeRecordsById,
  resolveAccountOwnedRoot,
  stampRecord,
  TNF_HOME,
  tryResolveAccountOwnedRoot,
} from './AccountOwnedPath.js';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  failCount: number;
  tags?: string[];
  /** Owning authenticated TNF account (cloud identity key). */
  ownerAccountId?: string;
  /** Stable per-user id (profile_id) owning this job. */
  ownerUserId?: string;
}

export class CronService {
  constructor() {}

  /** Legacy flat ~/.tnf/cron-jobs.json — read fallback for pre-binding data. */
  private legacyJobsPath(): string {
    return path.join(TNF_HOME(), 'cron-jobs.json');
  }

  /**
   * Account-nested write file ~/.tnf/cron/<ownerUserId>/cron-jobs.json.
   * Fail closed: throws when no TNF account binding is available.
   */
  private jobsFileForWrite(): string {
    const owned = resolveAccountOwnedRoot('cron');
    fs.mkdirSync(owned.root, { recursive: true, mode: 0o700 });
    return path.join(owned.root, 'cron-jobs.json');
  }

  private jobsFilesForRead(): string[] {
    const ownedRoot = tryResolveAccountOwnedRoot('cron')?.root;
    const ownedFile = ownedRoot ? path.join(ownedRoot, 'cron-jobs.json') : null;
    const legacyFile = this.legacyJobsPath();
    return ownedFile && ownedFile !== legacyFile ? [ownedFile, legacyFile] : [legacyFile];
  }

  private readJobs(): CronJob[] {
    const lists: CronJob[][] = [];
    for (const jobsPath of this.jobsFilesForRead()) {
      if (!fs.existsSync(jobsPath)) continue;
      try {
        lists.push(JSON.parse(fs.readFileSync(jobsPath, 'utf8')) as CronJob[]);
      } catch {
        /* fall through to next candidate */
      }
    }
    if (lists.length === 0) return this.getDefaultJobs();
    // Owned rows win on id collision; legacy rows stay visible until adopted.
    return mergeRecordsById(lists);
  }

  private writeJobs(jobs: CronJob[]): void {
    const owned = resolveAccountOwnedRoot('cron');
    const stamp = accountOwnedStamp(owned);
    const stamped = jobs.map((j) => stampRecord(j, stamp));
    fs.mkdirSync(owned.root, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(owned.root, 'cron-jobs.json'), JSON.stringify(stamped, null, 2), {
      mode: 0o600,
    });
  }

  async list(): Promise<CronJob[]> {
    return this.readJobs();
  }

  async add(
    id: string,
    schedule: string,
    command: string,
    options: { description?: string; disabled?: boolean } = {}
  ): Promise<CronJob> {
    const jobs = this.readJobs();

    if (jobs.find((j) => j.id === id)) {
      throw new Error(`Cron job ${id} already exists`);
    }

    const job: CronJob = {
      id,
      name: id,
      schedule,
      command,
      enabled: !options.disabled,
      description: options.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      failCount: 0,
    };

    jobs.push(job);
    this.writeJobs(jobs);
    return job;
  }

  async remove(id: string): Promise<void> {
    const jobs = this.readJobs();
    const index = jobs.findIndex((j) => j.id === id);

    if (index === -1) {
      throw new Error(`Cron job not found: ${id}`);
    }

    jobs.splice(index, 1);
    this.writeJobs(jobs);
  }

  async enable(id: string): Promise<CronJob> {
    const jobs = this.readJobs();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      throw new Error(`Cron job not found: ${id}`);
    }

    job.enabled = true;
    job.updatedAt = new Date().toISOString();
    this.writeJobs(jobs);
    return job;
  }

  async disable(id: string): Promise<CronJob> {
    const jobs = this.readJobs();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      throw new Error(`Cron job not found: ${id}`);
    }

    job.enabled = false;
    job.updatedAt = new Date().toISOString();
    this.writeJobs(jobs);
    return job;
  }

  async get(id: string): Promise<CronJob | undefined> {
    const jobs = this.readJobs();
    return jobs.find((j) => j.id === id);
  }

  async update(id: string, updates: Partial<Omit<CronJob, 'id'>>): Promise<CronJob> {
    const jobs = this.readJobs();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      throw new Error(`Cron job not found: ${id}`);
    }

    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    this.writeJobs(jobs);
    return job;
  }

  private getDefaultJobs(): CronJob[] {
    return [
      {
        id: 'health-check',
        name: 'Health Check',
        schedule: '*/3 * * * *',
        command: 'tnf doctor --quiet',
        enabled: true,
        description: 'Run TNF doctor diagnostics every 3 minutes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
      {
        id: 'self-improvement',
        name: 'Self-Improvement Cycle',
        schedule: '0 */4 * * *',
        command: 'tnf self-improvement run --auto',
        enabled: true,
        description: 'Run self-improvement audit every 4 hours',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
      {
        id: 'weekly-report',
        name: 'Weekly Report',
        schedule: '0 9 * * 1',
        command: 'tnf reports generate --weekly',
        enabled: true,
        description: 'Generate weekly status report every Monday at 9 AM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
      {
        id: 'marketplace-mcp-curator',
        name: 'Marketplace MCP Curator',
        schedule: '0 */6 * * *',
        command: 'tnf marketplace curate --source mcp',
        enabled: true,
        description: 'Crawl and curate new MCP servers for the marketplace',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
      {
        id: 'marketplace-skill-curator',
        name: 'Marketplace Skill Curator',
        schedule: '0 */8 * * *',
        command: 'tnf marketplace curate --source skills',
        enabled: true,
        description: 'Crawl and curate new skills for the marketplace',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
      {
        id: 'marketplace-daily-seed',
        name: 'Marketplace Daily Seed Sync',
        schedule: '0 3 * * *',
        command: 'tnf marketplace seed',
        enabled: true,
        description: 'Re-seed marketplace catalog with latest curated items',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
        failCount: 0,
      },
    ];
  }
}
