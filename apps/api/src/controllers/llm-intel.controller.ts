import { Controller, Get } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  AuthLevel,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';

const DATA_DIR = path.resolve(process.cwd(), 'data/llm-intel');

@Controller('llm-intel')
export class LLMIntelController {
  @Get('ranking-recommendations')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @SetRateLimitTier(RateLimitTier.ADMIN)
  async getRankingRecommendations() {
    const filePath = path.join(DATA_DIR, 'ranking-recommendations.json');
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { compositeScores: [], recommendations: [], newsDigest: [], summary: {}, generatedAt: null };
    }
  }

  @Get('arena-intel-latest')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @SetRateLimitTier(RateLimitTier.ADMIN)
  async getArenaIntelLatest() {
    const filePath = path.join(DATA_DIR, 'arena-intel-latest.json');
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { arenaData: [], newsData: [], nvidiaHealth: [], summary: {} };
    }
  }

  @Get('ranking-report')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @SetRateLimitTier(RateLimitTier.ADMIN)
  async getRankingReport() {
    const filePath = path.join(DATA_DIR, 'ranking-report-latest.md');
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return { report: raw };
    } catch {
      return { report: null };
    }
  }

  @Get('history')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @SetRateLimitTier(RateLimitTier.ADMIN)
  async getHistory() {
    const historyDir = path.join(DATA_DIR, 'history');
    try {
      const files = await fs.readdir(historyDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 7);
      const snapshots = await Promise.all(
        jsonFiles.map(async f => {
          const raw = await fs.readFile(path.join(historyDir, f), 'utf8');
          return { file: f, data: JSON.parse(raw) };
        }),
      );
      return snapshots;
    } catch {
      return [];
    }
  }
}
