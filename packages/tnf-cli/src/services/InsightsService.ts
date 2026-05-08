import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface UsageStats {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgSessionLength: number;
  topModels: Array<{ model: string; count: number; tokens: number }>;
  tokenUsage: Array<{ date: string; tokens: number; cost: number }>;
}

export class InsightsService {
  private statsDir: string;

  constructor() {
    this.statsDir = path.join(os.homedir(), '.tnf', 'stats');
    if (!fs.existsSync(this.statsDir)) {
      fs.mkdirSync(this.statsDir, { recursive: true });
    }
  }

  async getStats(): Promise<UsageStats> {
    const sessionsFile = path.join(os.homedir(), '.tnf', 'sessions', 'sessions.json');
    let sessions: any[] = [];
    if (fs.existsSync(sessionsFile)) {
      try { sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8')); } catch { /* ignore */ }
    }

    const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokenCount || 0), 0);
    const totalCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0);

    const modelMap = new Map<string, { count: number; tokens: number }>();
    for (const s of sessions) {
      if (!s.model) continue;
      const existing = modelMap.get(s.model) || { count: 0, tokens: 0 };
      existing.count++;
      existing.tokens += s.tokenCount || 0;
      modelMap.set(s.model, existing);
    }

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalTokens,
      totalCost,
      avgSessionLength: sessions.length > 0 ? totalMessages / sessions.length : 0,
      topModels: Array.from(modelMap.entries()).map(([model, data]) => ({ model, ...data })).sort((a, b) => b.count - a.count).slice(0, 5),
      tokenUsage: [],
    };
  }

  async exportStats(format: 'json' | 'csv'): Promise<string> {
    const stats = await this.getStats();
    if (format === 'csv') {
      return `metric,value\ntotalSessions,${stats.totalSessions}\ntotalMessages,${stats.totalMessages}\ntotalTokens,${stats.totalTokens}\ntotalCost,${stats.totalCost}\navgSessionLength,${stats.avgSessionLength}`;
    }
    return JSON.stringify(stats, null, 2);
  }
}
