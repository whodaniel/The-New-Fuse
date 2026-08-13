import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StatsRecord {
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  tool?: string;
  project?: string;
  sessionId?: string;
}

export interface StatsSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number; count: number }>;
  byModel: Record<string, { tokens: number; cost: number; count: number }>;
  byTool: Record<string, { tokens: number; cost: number; count: number }>;
  byProject: Record<string, { tokens: number; cost: number; count: number }>;
}

export interface StatsOptions {
  days?: number;
  provider?: string;
  model?: string;
  project?: string;
  limit?: number;
}

export class StatsService {
  private statsPath: string;
  private records: StatsRecord[] = [];

  constructor(statsPath?: string) {
    this.statsPath = statsPath || path.join(os.homedir(), '.local', 'share', 'tnf', 'stats.json');
    this.loadStats();
  }

  private loadStats(): void {
    if (fs.existsSync(this.statsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.statsPath, 'utf8'));
        this.records = Array.isArray(data) ? data : (data.records || []);
      } catch {
        this.records = [];
      }
    }
  }

  private saveStats(): void {
    const dir = path.dirname(this.statsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.statsPath, JSON.stringify(this.records, null, 2));
  }

  async record(record: Omit<StatsRecord, 'timestamp'>): Promise<void> {
    const fullRecord: StatsRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };
    this.records.push(fullRecord);
    this.saveStats();
  }

  async getSummary(options: StatsOptions = {}): Promise<StatsSummary> {
    let filtered = [...this.records];

    if (options.days) {
      const since = Date.now() - options.days * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(r => new Date(r.timestamp).getTime() >= since);
    }

    if (options.provider) {
      filtered = filtered.filter(r => r.provider === options.provider);
    }

    if (options.model) {
      filtered = filtered.filter(r => r.model === options.model);
    }

    if (options.project !== undefined) {
      if (options.project === '') {
        filtered = filtered.filter(r => !r.project);
      } else {
        filtered = filtered.filter(r => r.project === options.project);
      }
    }

    const summary: StatsSummary = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {},
      byTool: {},
      byProject: {},
    };

    for (const record of filtered) {
      summary.totalInputTokens += record.inputTokens;
      summary.totalOutputTokens += record.outputTokens;
      summary.totalTokens += record.totalTokens;
      summary.totalCost += record.cost;

      if (!summary.byProvider[record.provider]) {
        summary.byProvider[record.provider] = { tokens: 0, cost: 0, count: 0 };
      }
      summary.byProvider[record.provider].tokens += record.totalTokens;
      summary.byProvider[record.provider].cost += record.cost;
      summary.byProvider[record.provider].count += 1;

      if (!summary.byModel[record.model]) {
        summary.byModel[record.model] = { tokens: 0, cost: 0, count: 0 };
      }
      summary.byModel[record.model].tokens += record.totalTokens;
      summary.byModel[record.model].cost += record.cost;
      summary.byModel[record.model].count += 1;

      if (record.tool) {
        if (!summary.byTool[record.tool]) {
          summary.byTool[record.tool] = { tokens: 0, cost: 0, count: 0 };
        }
        summary.byTool[record.tool].tokens += record.totalTokens;
        summary.byTool[record.tool].cost += record.cost;
        summary.byTool[record.tool].count += 1;
      }

      if (record.project) {
        if (!summary.byProject[record.project]) {
          summary.byProject[record.project] = { tokens: 0, cost: 0, count: 0 };
        }
        summary.byProject[record.project].tokens += record.totalTokens;
        summary.byProject[record.project].cost += record.cost;
        summary.byProject[record.project].count += 1;
      }
    }

    return summary;
  }

  async close(): Promise<void> {
    this.saveStats();
  }
}
