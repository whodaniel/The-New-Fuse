import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  AuthLevel,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../guards/secure-auth.guard.js';

@Controller('visualizations')
export class VisualizationsController {
  @Get('data/graph-artifacts.index.json')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getGraphArtifactsIndex() {
    const candidates = [
      path.resolve(
        process.cwd(),
        '../../apps/frontend/public/visualizations/data/graph-artifacts.index.json'
      ),
      path.resolve(
        process.cwd(),
        '../frontend/public/visualizations/data/graph-artifacts.index.json'
      ),
      path.resolve(
        process.cwd(),
        'apps/frontend/public/visualizations/data/graph-artifacts.index.json'
      ),
      path.resolve(process.cwd(), 'public/visualizations/data/graph-artifacts.index.json'),
      path.resolve(process.cwd(), 'visualizations/data/graph-artifacts.index.json'),
      path.resolve(
        __dirname,
        '../../../../apps/frontend/public/visualizations/data/graph-artifacts.index.json'
      ),
      path.resolve(
        __dirname,
        '../../../../apps/frontend/dist/visualizations/data/graph-artifacts.index.json'
      ),
      path.resolve(
        process.cwd(),
        'apps/frontend/dist/visualizations/data/graph-artifacts.index.json'
      ),
    ];

    for (const candidate of candidates) {
      try {
        const raw = await fs.readFile(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          servedFrom: candidate,
        };
      } catch {
        // try next candidate
      }
    }

    throw new InternalServerErrorException(
      'Graph artifacts index not found. Run `pnpm run viz:graph:publish` and redeploy.'
    );
  }
}
