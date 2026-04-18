import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as sqlite3 from 'sqlite3';

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
  private dbPath: string;
  private db: sqlite3.Database | null = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(os.homedir(), '.local', 'share', 'tnf', 'stats.db');
  }

  async init(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else {
          this.db!.run(`
            CREATE TABLE IF NOT EXISTS stats (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp TEXT NOT NULL,
              provider TEXT NOT NULL,
              model TEXT NOT NULL,
              inputTokens INTEGER NOT NULL,
              outputTokens INTEGER NOT NULL,
              totalTokens INTEGER NOT NULL,
              cost REAL NOT NULL,
              tool TEXT,
              project TEXT,
              sessionId TEXT
            )
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  }

  async record(record: Omit<StatsRecord, 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO stats (timestamp, provider, model, inputTokens, outputTokens, totalTokens, cost, tool, project, sessionId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [new Date().toISOString(), record.provider, record.model, record.inputTokens, record.outputTokens, record.totalTokens, record.cost, record.tool || null, record.project || null, record.sessionId || null],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getSummary(options: StatsOptions = {}): Promise<StatsSummary> {
    if (!this.db) await this.init();

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (options.days) {
      const since = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000).toISOString();
      whereClause += ' AND timestamp >= ?';
      params.push(since);
    }
    if (options.provider) {
      whereClause += ' AND provider = ?';
      params.push(options.provider);
    }
    if (options.model) {
      whereClause += ' AND model = ?';
      params.push(options.model);
    }
    if (options.project !== undefined) {
      if (options.project === '') {
        whereClause += ' AND project IS NULL OR project = ?';
        params.push('');
      } else {
        whereClause += ' AND project = ?';
        params.push(options.project);
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

    const queryTotal = `SELECT
      SUM(inputTokens) as totalInputTokens,
      SUM(outputTokens) as totalOutputTokens,
      SUM(totalTokens) as totalTokens,
      SUM(cost) as totalCost
      FROM stats WHERE ${whereClause}`;

    const queryGrouped = `SELECT
      provider, model, tool, project,
      SUM(inputTokens) as inputTokens,
      SUM(outputTokens) as outputTokens,
      SUM(totalTokens) as totalTokens,
      SUM(cost) as totalCost,
      COUNT(*) as count
      FROM stats WHERE ${whereClause}
      GROUP BY provider, model, tool, project`;

    return new Promise((resolve, reject) => {
      this.db!.get(queryTotal, params, (err, row: any) => {
        if (err) reject(err);
        else {
          if (row) {
            summary.totalInputTokens = row.totalInputTokens || 0;
            summary.totalOutputTokens = row.totalOutputTokens || 0;
            summary.totalTokens = row.totalTokens || 0;
            summary.totalCost = row.totalCost || 0;
          }
          this.db!.all(queryGrouped, params, (err, rows: any[]) => {
            if (err) reject(err);
            else {
              for (const row of rows) {
                if (row.provider) {
                  if (!summary.byProvider[row.provider]) {
                    summary.byProvider[row.provider] = { tokens: 0, cost: 0, count: 0 };
                  }
                  summary.byProvider[row.provider].tokens += row.totalTokens;
                  summary.byProvider[row.provider].cost += row.totalCost;
                  summary.byProvider[row.provider].count += row.count;
                }
                if (row.model) {
                  if (!summary.byModel[row.model]) {
                    summary.byModel[row.model] = { tokens: 0, cost: 0, count: 0 };
                  }
                  summary.byModel[row.model].tokens += row.totalTokens;
                  summary.byModel[row.model].cost += row.totalCost;
                  summary.byModel[row.model].count += row.count;
                }
                if (row.tool) {
                  if (!summary.byTool[row.tool]) {
                    summary.byTool[row.tool] = { tokens: 0, cost: 0, count: 0 };
                  }
                  summary.byTool[row.tool].tokens += row.totalTokens;
                  summary.byTool[row.tool].cost += row.totalCost;
                  summary.byTool[row.tool].count += row.count;
                }
                if (row.project) {
                  if (!summary.byProject[row.project]) {
                    summary.byProject[row.project] = { tokens: 0, cost: 0, count: 0 };
                  }
                  summary.byProject[row.project].tokens += row.totalTokens;
                  summary.byProject[row.project].cost += row.totalCost;
                  summary.byProject[row.project].count += row.count;
                }
              }
              resolve(summary);
            }
          });
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }
}
