import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
}

export class CronService {
  private readonly jobsPath: string;

  constructor() {
    this.jobsPath = path.join(os.homedir(), '.tnf', 'cron-jobs.json');
  }

  private readJobs(): CronJob[] {
    if (!fs.existsSync(this.jobsPath)) {
      return this.getDefaultJobs();
    }

    try {
      const data = fs.readFileSync(this.jobsPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultJobs();
    }
  }

  private writeJobs(jobs: CronJob[]): void {
    fs.writeFileSync(this.jobsPath, JSON.stringify(jobs, null, 2));
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
