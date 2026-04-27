import { Controller, Get } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  AuthLevel,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';

@Controller('knowledge')
export class CompoundingMemoryController {
  @Get('clusters')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getClusters() {
    const graphPath = path.resolve(process.cwd(), 'data/memory-graph.json');

    try {
      const raw = await fs.readFile(graphPath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      // If the file doesn't exist yet, return an empty array
      return [];
    }
  }

  @Get('indices')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getIndices() {
    return [
      {
        id: 'compounding-memory-wiki',
        name: 'Karpathy AI Wiki',
        dimension: 1536,
        metric: 'cosine',
        vectorsCount: 0, // In production, this would query pgvector
        status: 'ready',
      },
    ];
  }
}
