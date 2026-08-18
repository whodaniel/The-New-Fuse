import { Controller, Get, Post } from '@nestjs/common';
import {
  AdminOnly,
  AuthLevel,
  JwtAuth,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../../guards/secure-auth.guard';
import { HarnessService } from './harness.service';

@Controller('harness')
export class HarnessController {
  constructor(private readonly harness: HarnessService) {}

  @Get('status')
  @JwtAuth()
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getStatus() {
    const data = await this.harness.getStatus();
    return { success: true, data };
  }

  @Get('config')
  @JwtAuth()
  async getConfig() {
    const data = await this.harness.getStatus();
    return { success: true, data: data.harness };
  }

  @Post('inspect')
  @AdminOnly()
  async inspect() {
    const data = await this.harness.runInspect();
    return { success: true, data };
  }

  @Get('health')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async health() {
    const data = await this.harness.getStatus();
    const paused = Boolean((data.fleet as { paused?: boolean })?.paused);
    return {
      status: paused ? 'paused' : 'ok',
      fleetMode: data.fleet,
      registryCount: data.relay.registryCount,
      timestamp: data.timestamp,
    };
  }
}
